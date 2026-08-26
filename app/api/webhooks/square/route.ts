import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createTask, taskNameExists } from '@/lib/clickup'
import { sendErrorAlert } from '@/lib/email'
import {
  SquareInvoice,
  SquareOrder,
  fetchOrder,
  isWholesaleInvoice,
  buildTaskDescription,
  countCoconuts,
} from '@/lib/square'

// "Wholesale" list in the Windansea Events space
const WHOLESALE_LIST_ID = '901414721789'

// ClickUp custom field IDs (Wholesale list)
const CLICKUP_FIELDS = {
  companyName: '75e86982-b682-4c56-86c4-2007b87d89df',
  clientFirstName: '6448e40e-5c59-4aeb-b99a-5755536b9463',
  clientLastName: '7ec644ea-814a-4a79-ab52-4a4543466cfb',
  clientEmail: 'a4316b37-4646-4db8-93d7-c37561d17a77',
  clientPhone: '2d0cc4d7-91e9-4d8d-bc0e-43321cfa1d48',
  coconutQty: '3e9943e1-4e51-466b-9d6d-f01e862a1bec',
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!key) {
    console.warn('SQUARE_WEBHOOK_SIGNATURE_KEY not set — skipping Square signature verification')
    return true
  }
  if (!signature) return false

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://windansea.vercel.app'
  const expected = createHmac('sha256', key)
    .update(`${baseUrl}/api/webhooks/square${rawBody}`)
    .digest('base64')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  let invoice: SquareInvoice | undefined
  try {
    const rawBody = await req.text()

    if (!verifySignature(rawBody, req.headers.get('x-square-hmacsha256-signature'))) {
      console.error('Square webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    console.log('=== SQUARE WEBHOOK RECEIVED ===')
    console.log(JSON.stringify(body, null, 2))

    if (body.type !== 'invoice.published') {
      return NextResponse.json({ skipped: true, reason: `Ignored event type: ${body.type}` })
    }

    invoice = body.data?.object?.invoice as SquareInvoice | undefined
    if (!invoice?.id) {
      throw new Error('No invoice found in webhook payload')
    }

    let order: SquareOrder | null = null
    if (invoice.order_id) {
      order = await fetchOrder(invoice.order_id)
    }

    if (!isWholesaleInvoice(invoice, order)) {
      console.log(`Invoice ${invoice.id} is not wholesale — skipping`)
      return NextResponse.json({ skipped: true, reason: 'Not a wholesale invoice' })
    }

    const listId = WHOLESALE_LIST_ID

    const recipient = invoice.primary_recipient ?? {}
    const invoiceNumber = invoice.invoice_number ?? invoice.id
    const customerLabel =
      recipient.company_name ||
      [recipient.given_name, recipient.family_name].filter(Boolean).join(' ') ||
      'Unknown Customer'
    const taskName = `Wholesale — ${customerLabel} — Inv #${invoiceNumber}`

    // Square retries webhooks on failure — don't create the same task twice
    if (await taskNameExists(listId, `Inv #${invoiceNumber}`)) {
      console.log(`Task for invoice ${invoiceNumber} already exists — skipping`)
      return NextResponse.json({ skipped: true, reason: 'Task already exists' })
    }

    const rawPhone = (recipient.phone_number || '').replace(/\D/g, '')
    // ClickUp phone fields require E.164 format — prepend +1 for US numbers
    const phone = rawPhone ? (rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`) : ''

    const customFields: Array<{ id: string; value: unknown }> = []
    if (recipient.company_name) customFields.push({ id: CLICKUP_FIELDS.companyName, value: recipient.company_name })
    if (recipient.given_name) customFields.push({ id: CLICKUP_FIELDS.clientFirstName, value: recipient.given_name })
    if (recipient.family_name) customFields.push({ id: CLICKUP_FIELDS.clientLastName, value: recipient.family_name })
    if (recipient.email_address) customFields.push({ id: CLICKUP_FIELDS.clientEmail, value: recipient.email_address })
    if (phone) customFields.push({ id: CLICKUP_FIELDS.clientPhone, value: phone })
    const coconuts = countCoconuts(order)
    if (coconuts > 0) customFields.push({ id: CLICKUP_FIELDS.coconutQty, value: coconuts })

    // Invoice due date (date-only, e.g. "2026-09-15") — noon UTC so the date
    // displays on the correct calendar day in any US timezone
    const dueDateStr = invoice.payment_requests?.[0]?.due_date
    const dueDate = dueDateStr ? new Date(`${dueDateStr}T12:00:00Z`).getTime() : undefined

    const description = buildTaskDescription(invoice, order)
    const task = await createTask(taskName, description, customFields, { dueDate, listId })
    console.log('ClickUp wholesale task created:', task.id)

    return NextResponse.json({ success: true, taskId: task.id })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Square webhook error:', err)
    await sendErrorAlert({
      source: 'Square Webhook',
      error: errorMsg,
      context: {
        url: req.url,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoice_number,
        customer: invoice?.primary_recipient,
      },
    })
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
