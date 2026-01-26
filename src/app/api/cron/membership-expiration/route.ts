/**
 * Cron API Route: Membership Expiration
 *
 * Called daily by pg_cron to:
 * 1. Mark expired memberships
 * 2. Queue and send expiration notifications (Email + WhatsApp)
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server'
import { processMembershipExpirations } from '@/lib/notifications/membership-notifications'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET) {
      console.error('[CronMembershipExpiration] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (providedSecret !== CRON_SECRET) {
      console.warn('[CronMembershipExpiration] Invalid or missing cron secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CronMembershipExpiration] Starting batch process...')
    const startTime = Date.now()

    // Process expirations and send notifications
    const result = await processMembershipExpirations()

    const duration = Date.now() - startTime
    console.log(`[CronMembershipExpiration] Completed in ${duration}ms`, result)

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      result: {
        expiredCount: result.expiredCount,
        notificationsQueued: result.notificationsQueued,
        notificationsSent: result.notificationsSent,
        notificationsFailed: result.notificationsFailed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    })
  } catch (error) {
    console.error('[CronMembershipExpiration] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for health checks (without secret for basic status)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'membership-expiration',
    description: 'Daily cron job for membership expiration notifications',
    method: 'POST with Authorization: Bearer CRON_SECRET',
  })
}
