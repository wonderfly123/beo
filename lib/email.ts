import nodemailer from 'nodemailer'

const SMTP_USER = 'harrison@windanseacoconuts.com'

// Second sender account, used for client-facing intake emails
const INTAKE_SMTP_USER = 'mariela@windanseacoconuts.com'

function getTransporter() {
  const pass = process.env.SMTP_PASS
  if (!pass) throw new Error('SMTP_PASS must be set')

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: SMTP_USER, pass },
  })
}

function getIntakeTransporter() {
  const pass = process.env.SMTP_PASS_INTAKE
  if (!pass) throw new Error('SMTP_PASS_INTAKE must be set')

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: INTAKE_SMTP_USER, pass },
  })
}

const ALERT_EMAIL = 'jordan@windanseacoconuts.com'

export async function sendErrorAlert(params: {
  source: string
  error: string
  context?: Record<string, unknown>
}) {
  try {
    const transporter = getTransporter()
    const contextHtml = params.context
      ? `<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${JSON.stringify(params.context, null, 2)}</pre>`
      : ''

    await transporter.sendMail({
      from: `WSC Alerts <${SMTP_USER}>`,
      to: ALERT_EMAIL,
      subject: `[WSC Error] ${params.source}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #c44b2b;">Error in ${params.source}</h3>
          <p style="background: #fff0f0; padding: 12px; border-radius: 4px; border: 1px solid #fdd;">${params.error}</p>
          ${contextHtml}
          <p style="color: #999; font-size: 12px; margin-top: 16px;">Sent from windansea.vercel.app at ${new Date().toISOString()}</p>
        </div>
      `,
    })
  } catch (emailErr) {
    // Don't let alert failures cascade — just log
    console.error('Failed to send error alert email:', emailErr)
  }
}

export async function sendIntakeEmail(params: {
  to: string
  clientName: string
  intakeUrl: string
}) {
  const { to, clientName, intakeUrl } = params
  const transporter = getIntakeTransporter()

  await transporter.sendMail({
    from: `Windansea Coconuts <${INTAKE_SMTP_USER}>`,
    to,
    subject: `Welcome to Windansea Coconuts, let's plan your event`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; font-size: 14px; line-height: 1.6;">
        <p>Hi ${clientName},</p>
        <p>I'm Mariela, and it's my pleasure to personally welcome you to Windansea Coconuts. I'll be your dedicated Event Lead, looking after every detail of your event from today through service, so you'll always have one familiar point of contact who knows your celebration inside and out.</p>
        <p>To begin shaping everything around your vision, would you take a moment to share a few event details below? It helps us make certain every element is just as you imagine.</p>
        <p><a href="${intakeUrl}" style="color: #1a73e8;">Share your event details here</a></p>
        <p>This link is unique to your event, so please return anytime. Your details are saved and ready to refine whenever you'd like.</p>
        <p>I can't wait to create something memorable for you.</p>
        <p>Warmly,<br/>Mariela<br/>Event Lead, Windansea Coconuts 🥥</p>
      </div>
    `,
  })
}
