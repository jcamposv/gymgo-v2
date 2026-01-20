'use client'

import { useTransition, type ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import { signOutAction } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  children: React.ReactNode
}

export function LogoutButton({ children, disabled, ...props }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={disabled || isPending}
      {...props}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Cerrando...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
