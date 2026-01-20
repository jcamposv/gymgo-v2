import type { Metadata } from 'next'
import { LoginPageContent } from '@/components/auth/login-page-content'
import { generatePageMetadata } from '@/lib/seo.config'

export const metadata: Metadata = generatePageMetadata({
  title: 'Iniciar sesión',
  description: 'Inicia sesión en GymGo para acceder al panel de administración de tu gimnasio o centro fitness.',
  path: '/login',
})

export default function LoginPage() {
  return <LoginPageContent />
}
