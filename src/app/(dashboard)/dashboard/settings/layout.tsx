import { ReactNode } from 'react'
import { SettingsNav } from './settings-nav'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra la configuracion de tu gimnasio
        </p>
      </div>

      <SettingsNav />

      {children}
    </div>
  )
}
