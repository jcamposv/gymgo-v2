'use client'

import { SWRConfig } from 'swr'
import { toast } from 'sonner'

async function fetcher(url: string) {
  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message)
  }

  return res.json()
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 5000,
        onError: (error) => {
          toast.error(error.message)
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
