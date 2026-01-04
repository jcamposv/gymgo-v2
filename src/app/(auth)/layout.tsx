import Image from 'next/image'
import { Dumbbell } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding panel (hidden on mobile) */}
      <div className="relative hidden lg:flex flex-col bg-zinc-900 p-10 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute inset-0 bg-[url('/crossfit-01.jpg')] bg-cover bg-center bg-no-repeat opacity-40" />

        {/* Hero content */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;GymGo ha transformado la forma en que administramos nuestro gimnasio.
              Ahora todo esta en un solo lugar: miembros, clases, pagos y mas.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              Carlos Rodriguez - FitLife Gym
            </footer>
          </blockquote>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-lime-500/5 rounded-full blur-2xl" />
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md flex flex-col items-center justify-center">
          {/* Mobile logo */}
          {/* Logo */}
          <Image src="/default-logo.svg" alt="GymGo" width={190} height={40} className="mb-8" />
          {children}
        </div>
      </div>
    </div>
  )
}
