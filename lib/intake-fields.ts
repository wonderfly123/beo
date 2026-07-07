export interface IntakeFieldDef {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'date' | 'datetime-local' | 'number' | 'textarea' | 'select' | 'location'
  required: boolean
  clickupFieldId: string
  clickupFieldType: string // how ClickUp stores it (short_text, number, drop_down, date, location, etc.)
  options?: string[]
  placeholder?: string
  helpText?: string
  section: 'client' | 'package' | 'timing' | 'additional'
  half?: boolean // render at half width (side-by-side)
  hideWhenPackage?: string[] // hide this field when package matches one of these values
  labelByPackage?: Record<string, string> // override label when package matches
  helpByPackage?: Record<string, string> // override helpText when package matches
  showWhen?: { field: string; op: '>' | '>=' | '=='; value: number | string } // show only when another field's value satisfies the predicate
  helpImages?: Array<{ src: string; label: string }> // reference photos displayed via an info popup next to the field label
  helpLink?: { text: string; href: string } // hyperlink rendered beneath the field
}

// Matches the ClickUp Events list custom fields exactly
export const INTAKE_FIELDS: IntakeFieldDef[] = [
  // === Client Information ===
  { name: 'firstName', label: 'First Name', type: 'text', required: true, clickupFieldId: '6448e40e-5c59-4aeb-b99a-5755536b9463', clickupFieldType: 'short_text', section: 'client', half: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true, clickupFieldId: '7ec644ea-814a-4a79-ab52-4a4543466cfb', clickupFieldType: 'short_text', section: 'client', half: true },
  { name: 'email', label: 'Email', type: 'email', required: true, clickupFieldId: 'a4316b37-4646-4db8-93d7-c37561d17a77', clickupFieldType: 'email', section: 'client', half: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, clickupFieldId: '2d0cc4d7-91e9-4d8d-bc0e-43321cfa1d48', clickupFieldType: 'phone', section: 'client', half: true },
  { name: 'eventName', label: 'Event Name', type: 'text', required: true, clickupFieldId: '', clickupFieldType: 'task_name', section: 'client', half: true },
  { name: 'company', label: 'Company', type: 'text', required: false, clickupFieldId: '75e86982-b682-4c56-86c4-2007b87d89df', clickupFieldType: 'short_text', placeholder: 'If applicable', section: 'client', half: true },

  // === Event Package Details ===
  { name: 'package', label: 'Package', type: 'select', required: true, clickupFieldId: '72edb0f2-022a-4db4-8ec4-88d694cd54b0', clickupFieldType: 'drop_down', options: ['Sandcastle', 'Cabana', 'Villa'], section: 'package', helpByPackage: { Sandcastle: 'Delivery only — custom branded coconuts, prepped and hand-delivered to your event.', Cabana: 'Delivery plus live service — a coconut specialist serves your guests from a styled service cart.', Villa: 'Our top-tier package — delivery, live service, and premium brand activation with tailored presentation.' }, helpLink: { text: 'Package Details', href: 'https://windanseacoconuts.com/pricing' } },
  { name: 'eventType', label: 'Event Type', type: 'select', required: true, clickupFieldId: 'afb623cf-472e-4d03-b220-bf3b3ce11bc6', clickupFieldType: 'drop_down', options: ['Conference', 'Birthday Party', 'Corporate Event', 'Shower', 'Wedding', 'Special Event', 'Brand Activation', 'Other'], section: 'package', half: true },
  { name: 'headcount', label: 'Headcount', type: 'number', required: true, clickupFieldId: '019ed06a-6a3a-4782-877f-ec4e94b0ac30', clickupFieldType: 'number', section: 'package', half: true },
  { name: 'garnish', label: 'Garnish', type: 'select', required: true, clickupFieldId: 'b9341990-5265-41a1-ba1e-4cbd3c767084', clickupFieldType: 'drop_down', options: ['N/A', 'Orchids', 'Umbrellas', 'Pineapple Leaves', 'Other'], section: 'package', half: true },
  { name: 'otherGarnish', label: 'Other Garnish', type: 'text', required: false, clickupFieldId: '8de89e8b-2d7d-4269-b5cb-d8d6e6d3ab7c', clickupFieldType: 'short_text', placeholder: 'Describe the garnish', section: 'package', half: true, showWhen: { field: 'garnish', op: '==', value: 'Other' } },
  { name: 'coconutQty', label: 'Coconut Quantity', type: 'number', required: true, clickupFieldId: '3e9943e1-4e51-466b-9d6d-f01e862a1bec', clickupFieldType: 'number', section: 'package', half: true },
  { name: 'readyBy', label: 'Coconuts Ready at Service Start', type: 'number', required: true, clickupFieldId: '54389f19-e059-4418-b842-1b1cd12539ca', clickupFieldType: 'number', helpText: 'How many to have pre-opened when guests arrive; the rest are opened on-demand.', section: 'package', hideWhenPackage: ['Sandcastle'] },
  { name: 'setupProvided', label: 'Setup Provided?', type: 'select', required: true, clickupFieldId: '87c25b9c-21b0-4420-8ad9-3d36265d567b', clickupFieldType: 'drop_down', options: ['N/A', 'Yes', 'No'], helpText: 'Do you have an existing setup you\'d like us to use?', section: 'package', hideWhenPackage: ['Sandcastle'] },
  { name: 'preOpenedQty', label: 'Coconuts Opened Before Transport', type: 'number', required: false, clickupFieldId: 'd2b20171-ebe0-4274-9100-a1de0e8ecbbe', clickupFieldType: 'number', helpText: 'Opened at our kitchen and delivered already prepped. Leave 0 if none.', section: 'package' },
  { name: 'preOpenedStyle', label: 'Pre-Opened Style', type: 'select', required: false, clickupFieldId: 'cf3f9f4b-4d43-4b8c-b6a9-c87fccad890a', clickupFieldType: 'drop_down', options: ['Straw opening', 'Cut open'], section: 'package', showWhen: { field: 'preOpenedQty', op: '>', value: 0 }, helpImages: [{ src: '/coconut-straw-opening.png', label: 'Straw opening' }, { src: '/coconut-cut-open.png', label: 'Cut open' }] },
  { name: 'preOpenedWaterSide', label: 'Coconut Water on the Side?', type: 'select', required: false, clickupFieldId: 'e5e7e431-989e-4808-9431-9609567f678c', clickupFieldType: 'drop_down', options: ['Yes', 'No'], helpText: 'Serve the water in a separate bottle alongside the coconut.', section: 'package', showWhen: { field: 'preOpenedQty', op: '>', value: 0 } },

  // === Event Location and Timing ===
  { name: 'setupTime', label: 'Set Up Date and Time', type: 'datetime-local', required: true, clickupFieldId: '', clickupFieldType: 'task_start_date', helpText: 'When our team arrives to set up at the venue.', section: 'timing', half: true, labelByPackage: { Sandcastle: 'Delivery Window Start Date and Time' }, helpByPackage: { Sandcastle: 'Earliest time we can drop off the coconuts.' } },
  { name: 'teardownTime', label: 'Tear Down Date and Time', type: 'datetime-local', required: true, clickupFieldId: '', clickupFieldType: 'task_due_date', helpText: 'When our team finishes teardown and leaves.', section: 'timing', half: true, labelByPackage: { Sandcastle: 'Delivery Window End Date and Time' }, helpByPackage: { Sandcastle: 'Latest time we can drop off the coconuts.' } },
  { name: 'serviceStart', label: 'Service Start Date and Time', type: 'datetime-local', required: true, clickupFieldId: 'f6483054-1434-4c04-ac53-06af6042a96f', clickupFieldType: 'date', helpText: 'When we begin serving guests.', section: 'timing', half: true, hideWhenPackage: ['Sandcastle'] },
  { name: 'serviceEnd', label: 'Service End Date and Time', type: 'datetime-local', required: true, clickupFieldId: 'c4bcdf67-b72d-4531-953e-5cb542b14a3e', clickupFieldType: 'date', helpText: 'When service ends and we stop serving.', section: 'timing', half: true, hideWhenPackage: ['Sandcastle'] },
  { name: 'eventLocation', label: 'Event Location', type: 'text', required: true, clickupFieldId: 'b92b1e46-363e-4453-9888-b530ecdeefce', clickupFieldType: 'location', placeholder: 'Venue name and address', section: 'timing', half: true, hideWhenPackage: ['Sandcastle'] },
  { name: 'loadInLocation', label: 'Vendor Load-in Location', type: 'text', required: true, clickupFieldId: '967038c5-4d18-41d5-8c63-f01bf20ece7a', clickupFieldType: 'location', placeholder: 'Where should we load in?', section: 'timing', half: true, labelByPackage: { Sandcastle: 'Delivery Location' } },

  // === Additional Information ===
  { name: 'insurance', label: 'Insurance Requirements', type: 'textarea', required: true, clickupFieldId: 'c166861e-6340-4ec6-a7c6-0ef7b910ac1e', clickupFieldType: 'text', helpText: 'Any special insurance requirements?', section: 'additional' },
  { name: 'certsNeeded', label: 'Are there any certifications or other forms we need to fill on our end? Please Describe.', type: 'textarea', required: true, clickupFieldId: 'f459ee0d-aa89-4d9e-aeff-bf714b7728d6', clickupFieldType: 'text', placeholder: 'Health Department Permit, Certificate of Insurance (COI) naming venue as additional insured, Food Safety Manager Certification, etc?', section: 'additional' },
  { name: 'deliveryInstructions', label: 'Delivery Instructions', type: 'textarea', required: true, clickupFieldId: 'b4457a6a-5d84-4505-9e9b-6883303331b3', clickupFieldType: 'text', placeholder: 'Please be as specific as possible to ensure smooth delivery.', section: 'additional' },
  { name: 'eventNotes', label: 'Event Notes', type: 'textarea', required: true, clickupFieldId: 'd4ac6c86-d0d6-48e2-8958-b0ede74e3456', clickupFieldType: 'text', placeholder: 'Any details you can provide to make this an extra special event.', section: 'additional' },
]

// File upload fields — uploaded as task attachments with prefixed filenames
export const UPLOAD_FIELDS = [
  { name: 'stampLogo', label: 'Stamp Logo File', prefix: '[STAMP LOGO]', required: false, accept: 'image/png,image/jpeg', helpText: 'Upload your logo image (png or jpg)' },
  { name: 'deliveryMap', label: 'Map of Vendor Delivery Location', prefix: '[DELIVERY MAP]', required: false, accept: 'image/png,image/jpeg,application/pdf', helpText: 'Upload an event/delivery map if available' },
]

// Field ID for marking intake as complete after form submission
export const INTAKE_COMPLETE_FIELD_ID = 'dbeda913-50e7-4988-9f1d-d28ec26a9a6d'

// Timezone display label → IANA timezone ID
export const TIMEZONE_MAP: Record<string, string> = {
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Mountain Time (MT)': 'America/Denver',
  'Central Time (CT)': 'America/Chicago',
  'Eastern Time (ET)': 'America/New_York',
}

// Convert a datetime-local string (YYYY-MM-DDTHH:mm) in a given timezone to UTC epoch ms
export function toUtcEpoch(datetimeLocal: string, timezone: string): number {
  // datetime-local gives us "2026-04-15T07:35"
  // We need to interpret this as 7:35 AM in the given timezone
  const d = new Date(datetimeLocal)
  const utcStr = d.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = d.toLocaleString('en-US', { timeZone: timezone })
  const offset = new Date(utcStr).getTime() - new Date(tzStr).getTime()
  // d was parsed as UTC-like by Node, we need to shift it so the local time matches the target tz
  return d.getTime() + offset
}

// Convert a UTC epoch ms to a datetime-local string in a given timezone
export function fromUtcEpoch(epochMs: number, timezone: string): string {
  const d = new Date(epochMs)
  // Get date parts in the target timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

// Format a UTC epoch ms for display (BEO) in a given timezone
export function formatForDisplay(epochMs: number, timezone: string): string {
  const d = new Date(epochMs)
  const date = d.toLocaleDateString('en-US', { timeZone: timezone, dateStyle: 'medium' })
  const time = d.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' })
  const tzAbbr = d.toLocaleTimeString('en-US', { timeZone: timezone, timeZoneName: 'short' }).split(' ').pop()
  return `${date}, ${time} ${tzAbbr}`
}
