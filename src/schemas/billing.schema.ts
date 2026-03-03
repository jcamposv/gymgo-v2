import { z } from 'zod'

export const checkoutSessionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'pro']),
  billingPeriod: z.enum(['monthly', 'yearly']),
})

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>

export const updateSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'pro']),
  billingPeriod: z.enum(['monthly', 'yearly']),
})

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
