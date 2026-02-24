import { config } from 'dotenv'
config({ path: '.env.local' })
import { respondIoService } from '../src/lib/respond-io'

// Debug: check env vars
console.log('RESPOND_IO_API_KEY exists:', !!process.env.RESPOND_IO_API_KEY)
console.log('RESPOND_IO_WHATSAPP_CHANNEL_ID:', process.env.RESPOND_IO_WHATSAPP_CHANNEL_ID)

async function test() {
  console.log('Testing WhatsApp template membership_expired...')

  const result = await respondIoService.sendWhatsAppTemplate({
    to: '+50670124238',
    templateName: 'membership_expired',
    templateVariables: ['Juan Campos', 'Fit Gym', '28/01/2026'],
    firstName: 'Juan',
  })

  console.log('Result:', JSON.stringify(result, null, 2))

  if (!result.success) {
    console.log('\nTrying regular message as fallback...')
    const fallback = await respondIoService.sendWhatsAppMessage({
      to: '+50670124238',
      body: '❌ Hola Juan Campos, tu membresía en Fit Gym ha vencido. Renueva para volver a reservar clases.',
      firstName: 'Juan',
    })
    console.log('Fallback result:', JSON.stringify(fallback, null, 2))
  }
}

test().catch(console.error)
