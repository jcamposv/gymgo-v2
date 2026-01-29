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
import { createClient } from '@supabase/supabase-js'
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

    // Debug mode - check URL param
    const debug = request.nextUrl.searchParams.get('debug') === 'true'

    console.log('[CronMembershipExpiration] Starting batch process...')
    const startTime = Date.now()

    // Get debug info if requested
    let debugInfo = null
    if (debug) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Check what members exist with relevant dates
        const { data: members } = await supabase
          .from('members')
          .select('id, full_name, phone, email, membership_status, membership_end_date')
          .not('membership_end_date', 'is', null)
          .gte('membership_end_date', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .lte('membership_end_date', new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .limit(20)

        // Check if function returns results
        const { data: needingNotifs } = await supabase.rpc('get_members_needing_expiration_notifications')

        // Check existing notifications
        const { data: existingNotifs } = await supabase
          .from('membership_notifications')
          .select('id, organization_id, member_id, notification_type, channel, status, external_message_id, error_message, sent_at, created_at')
          .order('created_at', { ascending: false })
          .limit(10)

        // Also test get_queued_notifications RPC directly
        const { data: queuedViaRpc } = await supabase.rpc('get_queued_notifications', { p_limit: 10 })

        debugInfo = {
          currentDate: new Date().toISOString(),
          membersNearExpiration: members,
          membersNeedingNotifications: needingNotifs,
          recentNotifications: existingNotifs,
          queuedViaRpc: queuedViaRpc,
        }
      }
    }

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
      ...(debugInfo && { debug: debugInfo }),
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

