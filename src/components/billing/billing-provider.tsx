'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { StripeSubscription, BillingRecord } from '@/lib/stripe/types'
import type { PlanTier } from '@/lib/pricing.config'

interface BillingContextValue {
  currentPlan: PlanTier
  subscription: StripeSubscription | null
  billingHistory: { records: BillingRecord[]; total: number }
}

const BillingContext = createContext<BillingContextValue | null>(null)

export function useBilling() {
  const ctx = useContext(BillingContext)
  if (!ctx) throw new Error('useBilling must be used within BillingProvider')
  return ctx
}

export function BillingProvider({
  children,
  currentPlan,
  subscription,
  billingHistory,
}: BillingContextValue & { children: ReactNode }) {
  return (
    <BillingContext.Provider value={{ currentPlan, subscription, billingHistory }}>
      {children}
    </BillingContext.Provider>
  )
}
