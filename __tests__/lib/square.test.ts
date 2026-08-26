import { describe, it, expect } from 'vitest'
import {
  matchesWholesale,
  isWholesaleInvoice,
  buildTaskDescription,
  formatMoney,
  countCoconuts,
  SquareInvoice,
  SquareOrder,
} from '@/lib/square'

describe('matchesWholesale', () => {
  it('matches exact word case-insensitively', () => {
    expect(matchesWholesale('Wholesale order for September')).toBe(true)
    expect(matchesWholesale('WHOLESALE')).toBe(true)
    expect(matchesWholesale('wholesale')).toBe(true)
  })

  it('matches common misspellings', () => {
    expect(matchesWholesale('wholsale coconuts')).toBe(true)
    expect(matchesWholesale('wholesail order')).toBe(true)
    expect(matchesWholesale('wholesle')).toBe(true)
  })

  it('matches the word split in two', () => {
    expect(matchesWholesale('whole sale coconuts')).toBe(true)
  })

  it('matches wholesaler', () => {
    expect(matchesWholesale('for our wholesaler')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(matchesWholesale('Birthday party coconuts')).toBe(false)
    expect(matchesWholesale('Summer sale event')).toBe(false)
    expect(matchesWholesale('')).toBe(false)
    expect(matchesWholesale(undefined)).toBe(false)
  })
})

const invoice: SquareInvoice = {
  id: 'inv_123',
  invoice_number: '000042',
  title: 'Coconut Order',
  description: 'Standing wholesale order',
  order_id: 'ord_1',
  public_url: 'https://squareup.com/pay-invoice/inv_123',
  primary_recipient: {
    given_name: 'Jane',
    family_name: 'Smith',
    email_address: 'jane@acme.com',
    phone_number: '(619) 555-1234',
    company_name: 'Acme Co',
  },
  payment_requests: [{ due_date: '2026-09-15' }],
}

const order: SquareOrder = {
  id: 'ord_1',
  line_items: [
    { name: 'Case of Coconuts', quantity: '10', total_money: { amount: 40000, currency: 'USD' } },
    { name: 'Straws', quantity: '2', total_money: { amount: 1000, currency: 'USD' } },
  ],
  total_money: { amount: 41000, currency: 'USD' },
}

describe('isWholesaleInvoice', () => {
  it('matches on invoice message', () => {
    expect(isWholesaleInvoice(invoice, null)).toBe(true)
  })

  it('matches on line item name', () => {
    const inv = { ...invoice, title: 'Order', description: '' }
    const ord: SquareOrder = {
      id: 'ord_2',
      line_items: [{ name: 'Wholesale Coconuts', quantity: '5' }],
    }
    expect(isWholesaleInvoice(inv, ord)).toBe(true)
  })

  it('rejects when nothing matches', () => {
    const inv = { ...invoice, title: 'Wedding order', description: 'For the Smith wedding' }
    expect(isWholesaleInvoice(inv, order)).toBe(false)
  })
})

describe('formatMoney', () => {
  it('formats cents as dollars', () => {
    expect(formatMoney({ amount: 40000, currency: 'USD' })).toBe('$400.00')
    expect(formatMoney({ amount: 999, currency: 'USD' })).toBe('$9.99')
  })

  it('returns dash when missing', () => {
    expect(formatMoney(undefined)).toBe('—')
  })
})

describe('countCoconuts', () => {
  it('sums only coconut line item quantities', () => {
    // "Case of Coconuts" × 10 counts; "Straws" × 2 does not
    expect(countCoconuts(order)).toBe(10)
  })

  it('excludes fees and non-coconut lines', () => {
    const ord: SquareOrder = {
      id: 'ord_3',
      line_items: [
        { name: 'Branded Coconuts Pelican Hill', quantity: '15' },
        { name: 'Delivery fee', quantity: '1' },
      ],
    }
    expect(countCoconuts(ord)).toBe(15)
  })

  it('handles missing order', () => {
    expect(countCoconuts(null)).toBe(0)
  })
})

describe('buildTaskDescription', () => {
  it('includes invoice number, customer, line items, total, and link', () => {
    const desc = buildTaskDescription(invoice, order)
    expect(desc).toContain('Square Invoice #000042')
    expect(desc).toContain('Customer: Acme Co — Jane Smith')
    expect(desc).toContain('- Case of Coconuts × 10 — $400.00')
    expect(desc).toContain('- Straws × 2 — $10.00')
    expect(desc).toContain('Total: $410.00')
    expect(desc).toContain('https://squareup.com/pay-invoice/inv_123')
  })

  it('handles missing order gracefully', () => {
    const desc = buildTaskDescription(invoice, null)
    expect(desc).toContain('Square Invoice #000042')
    expect(desc).not.toContain('Line items:')
  })
})
