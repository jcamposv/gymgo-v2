import { redirect } from 'next/navigation'

// Redirect to main settings page with WhatsApp tab
export default function WhatsAppSettingsPage() {
  redirect('/dashboard/settings?tab=whatsapp')
}
