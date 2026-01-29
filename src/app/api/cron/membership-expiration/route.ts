/**
 * Cron API Route: Membership Expiration
 *
 * Called daily by Vercel Cron to:
 * 1. Mark expired memberships
 * 2. Queue and send expiration notifications (Email + WhatsApp)
 *
 * Security: Vercel Cron uses CRON_SECRET header automatically
 */

import { NextRequest, NextResponse } from 'next/server'
import { processMembershipExpirations } from '@/lib/notifications/membership-notifications'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron secret (sent as Authorization header)
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    // Also check for Vercel's cron header
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'

    if (!isVercelCron && CRON_SECRET && providedSecret !== CRON_SECRET) {
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

