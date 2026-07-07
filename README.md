# Windansea Coconuts — Event Operations

Next.js application powering event operations for Windansea Coconuts. Hosted on Vercel at `windansea.vercel.app`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 18, Tailwind CSS 3.4 |
| Testing | Vitest, React Testing Library, jsdom |
| Linting | ESLint 8, eslint-config-next |
| Email | Nodemailer (Gmail SMTP) |
| Hosting | Vercel (serverless) |

## Applications

### 1. Banquet Event Order (BEO)

Internal event document that pulls data from ClickUp and renders a printable BEO.

- **URL:** `/beo/[taskId]`
- **Source:** Reads task custom fields from ClickUp API
- **Use:** Share with staff and vendors for event day logistics

### 2. Client Intake Automation

End-to-end intake flow triggered when a Pipedrive deal hits "Closed Won."

**Flow:**
1. Pipedrive automation sends webhook to `/api/webhooks/pipedrive`
2. ClickUp task is created in the Events list with deal data pre-populated (contact info, coconut qty, event date as start date, Pipedrive Deal ID/Title)
3. "Intake Form Complete" is set to "No"
4. Client receives a warm email from Harrison with a link to the intake form
5. Client fills out `/intake/[taskId]` — all fields, dropdowns, and file uploads (stamp logo, delivery map)
6. On submission, ClickUp task is updated with all form data, attachments are uploaded, and "Intake Form Complete" flips to "Yes"

**Intake Form Sections:**
- Client Information (name, email, phone, company)
- Event Package Details (type, headcount, package, garnish, coconut qty, setup)
- Event Location & Timing (service start/end, venue, load-in location)
- Additional Information (insurance, certifications, delivery instructions, notes)
- File Uploads (stamp logo, delivery map)

## Project Structure

```
app/
  layout.tsx                    # Root layout
  page.tsx                      # Home page
  beo/
    page.tsx                    # BEO list/landing
    [taskId]/page.tsx           # BEO document view
  intake/
    page.tsx                    # Intake landing
    [taskId]/page.tsx           # Client intake form
  api/
    webhooks/pipedrive/route.ts # Pipedrive webhook handler
    intake/[taskId]/route.ts    # Intake form submission API
lib/
  clickup.ts                   # ClickUp API client
  email.ts                     # Email sending utilities
  intake-fields.ts             # Intake form field definitions
  types.ts                     # Shared TypeScript types
  google-maps.d.ts             # Google Maps type declarations
__tests__/
  lib/types.test.ts
  lib/clickup.test.ts
  components/BEODocument.test.tsx
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLICKUP_API_KEY` | ClickUp API key |
| `CLICKUP_LIST_ID` | Target list ID for new intake tasks (`901414665785`) |
| `SMTP_PASS` | Google Workspace App Password for Gmail SMTP |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (Places, Geocoding) |

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

## External Integrations

- **Pipedrive** — Automation webhook on "Closed Won" deals
- **ClickUp** — Task creation, custom field updates, file attachments
- **Gmail SMTP** — Client intake emails and error alerts (from harrison@windanseacoconuts.com)
- **Google Maps API** — Places autocomplete for venue address, server-side geocoding
- **Google Docs Viewer** — Inline PDF preview for ClickUp attachments
- **Vercel** — Hosting and serverless functions
