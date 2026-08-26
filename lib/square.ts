// Square API helpers for the wholesale invoice webhook.

export interface SquareMoney {
  amount?: number // smallest currency unit (cents for USD)
  currency?: string
}

export interface SquareLineItem {
  name?: string
  quantity?: string
  base_price_money?: SquareMoney
  total_money?: SquareMoney
}

export interface SquareOrder {
  id: string
  line_items?: SquareLineItem[]
  total_money?: SquareMoney
}

export interface SquareInvoiceRecipient {
  customer_id?: string
  given_name?: string
  family_name?: string
  email_address?: string
  phone_number?: string
  company_name?: string
}

export interface SquareInvoice {
  id: string
  invoice_number?: string
  title?: string
  description?: string
  order_id?: string
  public_url?: string
  primary_recipient?: SquareInvoiceRecipient
  payment_requests?: Array<{ due_date?: string }>
}

const SQUARE_API_BASE = 'https://connect.squareup.com/v2'
const SQUARE_API_VERSION = '2025-01-23'

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = curr
  }
  return prev[n]
}

/**
 * True when the text contains "wholesale" — case-insensitive and tolerant of
 * misspellings (edit distance ≤ 2, e.g. "wholsale", "wholesail") and of the
 * word being split ("whole sale").
 */
export function matchesWholesale(text: string | undefined | null): boolean {
  if (!text) return false
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const candidates: string[] = []
  for (let i = 0; i < words.length; i++) {
    // Skip short words so e.g. "sale" alone never matches
    if (words[i].length >= 6) candidates.push(words[i])
    if (i + 1 < words.length) candidates.push(words[i] + words[i + 1])
  }
  return candidates.some((w) => levenshtein(w, 'wholesale') <= 2)
}

/** Wholesale filter: invoice title, message, or any line item name matches. */
export function isWholesaleInvoice(invoice: SquareInvoice, order: SquareOrder | null): boolean {
  if (matchesWholesale(invoice.title) || matchesWholesale(invoice.description)) return true
  return (order?.line_items ?? []).some((li) => matchesWholesale(li.name))
}

export function formatMoney(money: SquareMoney | undefined): string {
  if (money?.amount === undefined || money.amount === null) return '—'
  return `$${(money.amount / 100).toFixed(2)}`
}

/**
 * Product counts by unit. Wholesale items are sold either by the case
 * ("Case of Coconuts") or as individual coconuts — a case quantity is not a
 * coconut count, so the two are tallied separately. Non-product lines
 * (delivery fees, shipping) are skipped. (Square sends quantity as a string.)
 */
export function countProducts(order: SquareOrder | null): { cases: number; coconuts: number } {
  const counts = { cases: 0, coconuts: 0 }
  for (const li of order?.line_items ?? []) {
    const name = li.name ?? ''
    if (/fee|delivery|shipping/i.test(name)) continue
    const q = Number(li.quantity)
    if (isNaN(q)) continue
    if (/case/i.test(name)) counts.cases += q
    else if (/coco/i.test(name)) counts.coconuts += q
  }
  return counts
}

export function buildTaskDescription(invoice: SquareInvoice, order: SquareOrder | null): string {
  const recipient = invoice.primary_recipient ?? {}
  const contactName = [recipient.given_name, recipient.family_name].filter(Boolean).join(' ')
  const customer = [recipient.company_name, contactName].filter(Boolean).join(' — ')

  const lines: string[] = [`Square Invoice #${invoice.invoice_number ?? invoice.id}`]
  if (customer) lines.push(`Customer: ${customer}`)
  if (invoice.description) lines.push(`Message: ${invoice.description}`)

  const items = order?.line_items ?? []
  if (items.length > 0) {
    lines.push('', 'Line items:')
    for (const li of items) {
      lines.push(`- ${li.name ?? 'Item'} × ${li.quantity ?? '1'} — ${formatMoney(li.total_money)}`)
    }
  }
  if (order?.total_money) lines.push(`Total: ${formatMoney(order.total_money)}`)
  if (invoice.public_url) lines.push('', `Invoice: ${invoice.public_url}`)

  return lines.join('\n')
}

export async function fetchOrder(orderId: string): Promise<SquareOrder> {
  const token = process.env.SQUARE_TOKEN
  if (!token) throw new Error('SQUARE_TOKEN not set')

  const res = await fetch(`${SQUARE_API_BASE}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Square-Version': SQUARE_API_VERSION,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Square fetchOrder failed: ${res.status} — ${errBody}`)
  }
  const data = await res.json()
  return data.order as SquareOrder
}
