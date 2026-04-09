import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendACALeadEmail } from '@/lib/email'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Send Twilio SMS for lead follow-up
 * Only sends if Twilio is configured in environment variables
 */
async function sendTwilioFollowUp(lead: any) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
  } = process.env

  // Check if Twilio is configured
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log('Twilio not configured, skipping SMS')
    return false
  }

  try {
    // Dynamic import to avoid bundling issues
    const twilio = await import('twilio')
    const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    const message = `Hola ${lead.name}, somos Marilife. ¡Gracias por revisar su subsidio ACA! ` +
      `Calificó para $${lead.estimatedSubsidy}/mes en ahorros. ` +
      `Un agente licenciado le llamará pronto al ${lead.phone} para discutir sus opciones de $${lead.estimatedPremium}/mes. ` +
      `Responda STOP para cancelar.`

    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: `+1${lead.phone}`, // Assuming US numbers
    })

    console.log('Twilio SMS sent:', result.sid)
    return true
  } catch (error) {
    console.error('Failed to send Twilio SMS:', error)
    return false
  }
}

/**
 * Send lead notification email to Marilife agent using Python script
 */
async function sendLeadNotificationEmail(lead: any) {
  try {
    // Create email content for Mariela
    const subject = `🎯 NUEVO LEAD ACA: ${lead.name} - $${lead.estimatedSubsidy}/mes de subsidio`
    
    const body = `
NUEVO LEAD CAPTURADO - ACA Insurance Funnel
===========================================

📋 INFORMACIÓN DEL CLIENTE:
• Nombre: ${lead.name}
• Email: ${lead.email}
• Teléfono: ${lead.phone}
• Edad: ${lead.age}
• Ingreso anual: $${lead.income}
• Tamaño del hogar: ${lead.householdSize}
• Código postal: ${lead.zipCode}
• Fumador: ${lead.tobaccoUse ? 'Sí' : 'No'}

💰 ESTIMADO DE SUBSIDIO:
• Subsidio mensual: $${lead.estimatedSubsidy}
• Prima estimada: $${lead.estimatedPremium}
• Nivel de plan: ${lead.planTier}

⏰ FECHA: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}

📞 ACCIÓN REQUERIDA:
1. Cotizar planes reales en HealthSherpa.com
2. Llamar al cliente en 24 horas
3. Seguir protocolo de venta ACA

🔗 HEALTHSHERPA:
- Iniciar sesión: https://broker.healthsherpa.com
- Usar ZIP ${lead.zipCode}, edad ${lead.age}, ingreso $${lead.income}

💡 NOTAS:
- Este lead viene del funnel ACA automatizado
- Cliente espera llamada para cotizaciones reales
- Recordar: planes mostrados fueron ejemplos, necesita cotización real
`

    // Save to temporary file
    const fs = await import('fs')
    const path = await import('path')
    
    const tempDir = '/tmp'
    const tempFile = path.join(tempDir, `lead_${Date.now()}.txt`)
    
    fs.writeFileSync(tempFile, body)
    
    // Use existing Python script to send email
    const pythonScript = '/home/lina/.openclaw/workspace/send_email.py'
    
    // Create a simple Python script to send this specific email
    const pythonCode = `
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

EMAIL = "linamarilife@gmail.com"
APP_PASSWORD = "uedvzrhkqbxbbymq"

def send_email():
    msg = MIMEMultipart()
    msg["From"] = EMAIL
    msg["To"] = EMAIL  # Send to yourself for now
    msg["Subject"] = "${subject.replace(/"/g, '\\"')}"
    msg.attach(MIMEText("""${body.replace(/"/g, '\\"')}""", "plain"))
    
    context = ssl.create_default_context()
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls(context=context)
            server.login(EMAIL, APP_PASSWORD)
            server.sendmail(EMAIL, EMAIL, msg.as_string())
            print("✅ Email de lead enviado a Mariela")
            return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    send_email()
`
    
    const pythonFile = path.join(tempDir, `send_lead_email_${Date.now()}.py`)
    fs.writeFileSync(pythonFile, pythonCode)
    
    // Execute Python script
    const { stdout, stderr } = await execAsync(`python3 ${pythonFile}`)
    
    // Clean up
    fs.unlinkSync(tempFile)
    fs.unlinkSync(pythonFile)
    
    if (stderr) {
      console.error('Python script stderr:', stderr)
    }
    
    console.log('Lead notification email sent to Mariela')
    return true
    
  } catch (error) {
    console.error('Failed to send lead notification email:', error)
    return false
  }
}

/**
 * Send welcome email to the lead (optional)
 */
async function sendWelcomeEmail(lead: any) {
  console.log('Would send welcome email to lead:', lead.email)
  // TODO: Implement when needed
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'age', 'income', 'householdSize', 'zipCode']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Extract and validate data
    const leadData = {
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: String(body.phone).replace(/\D/g, ''), // Store digits only
      age: Number(body.age),
      income: Number(body.income),
      householdSize: Number(body.householdSize),
      zipCode: String(body.zipCode),
      tobaccoUse: Boolean(body.tobaccoUse),
      estimatedPremium: Number(body.estimatedPremium) || 0,
      estimatedSubsidy: Number(body.subsidyAmount) || 0,
      planTier: String(body.planTier || 'Unknown'),
    }

    // Basic validation
    if (leadData.age < 18 || leadData.age > 100) {
      return NextResponse.json(
        { error: 'Invalid age' },
        { status: 400 }
      )
    }

    if (!/^\d{5}$/.test(leadData.zipCode)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(leadData.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (leadData.phone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Check for existing lead with same email or phone
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { email: leadData.email },
          { phone: leadData.phone }
        ]
      }
    })

    if (existingLead) {
      // Update existing lead instead of creating duplicate
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: leadData
      })

      // Send follow-up communications (async - don't wait for response)
      Promise.all([
        sendTwilioFollowUp(updatedLead),
        sendACALeadEmail(updatedLead), // Email to Mariela with lead details
      ]).catch(err => console.error('Error sending follow-ups:', err))

      return NextResponse.json({
        success: true,
        message: 'Lead updated successfully',
        lead: updatedLead,
        isUpdate: true
      })
    }

    // Create new lead
    const lead = await prisma.lead.create({
      data: leadData
    })

    // Send follow-up communications (async - don't wait for response)
    Promise.all([
      sendTwilioFollowUp(lead), // SMS to lead (if Twilio configured)
      sendACALeadEmail(lead), // Email to Mariela with lead details
    ]).catch(err => console.error('Error sending follow-ups:', err))

    // In a production environment, you would also:
    // 1. Add to CRM (Salesforce, HubSpot)
    // 2. Send to email marketing platform
    // 3. Notify sales team via Slack/email
    // 4. Trigger follow-up sequences

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      lead,
      isUpdate: false
    })

  } catch (error) {
    console.error('Lead API error:', error)
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'A lead with this email or phone already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get leads (for admin purposes - would add authentication in production)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // In production, add authentication here
    // const session = await getServerSession(authOptions)
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leads = await prisma.lead.findMany({
      take: limit,
      skip,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const total = await prisma.lead.count()

    return NextResponse.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get leads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}