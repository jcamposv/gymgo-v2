'use server'

import { createClient } from '@/lib/supabase/server'
import { resend, emailConfig } from '@/lib/email/resend'
import {
  upgradeRequestSchema,
  type UpgradeRequestFormValues,
  type UpgradeRequest,
  type UpgradeRequestStatus,
} from '@/schemas/upgrade-request.schema'
import { PRICING_PLANS } from '@/lib/pricing.config'

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// =============================================================================
// CREATE UPGRADE REQUEST
// =============================================================================

export async function createUpgradeRequest(
  input: UpgradeRequestFormValues
): Promise<ActionResult<{ id: string; status: UpgradeRequestStatus }>> {
  try {
    // Validate input
    const validationResult = upgradeRequestSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error.issues[0]?.message || 'Datos invalidos',
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'No autenticado' }
    }

    // Get user profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, message: 'No se encontro la organizacion' }
    }

    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, subscription_plan')
      .eq('id', profile.organization_id)
      .single()

    if (!organization) {
      return { success: false, message: 'Organizacion no encontrada' }
    }

    const currentPlan = organization.subscription_plan || 'free'

    // Check for existing pending request for the same plan
    const { data: existingRequest } = await supabase
      .from('upgrade_requests')
      .select('id, status, requested_plan')
      .eq('organization_id', profile.organization_id)
      .eq('requested_plan', input.requestedPlan)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return {
        success: true,
        message: 'Ya tienes una solicitud pendiente para este plan',
        data: {
          id: existingRequest.id,
          status: existingRequest.status as UpgradeRequestStatus,
        },
      }
    }

    // Create the upgrade request
    const { data: newRequest, error: insertError } = await supabase
      .from('upgrade_requests')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        requested_plan: input.requestedPlan,
        current_plan: currentPlan,
        seats: input.seats || null,
        message: input.message || null,
        contact_email: input.contactEmail,
        contact_name: input.contactName,
        status: 'pending',
      })
      .select('id, status')
      .single()

    if (insertError || !newRequest) {
      console.error('Error creating upgrade request:', insertError)
      return { success: false, message: 'Error al crear la solicitud' }
    }

    // Send email notification to admin
    try {
      await sendUpgradeRequestEmail({
        organizationName: organization.name,
        organizationId: profile.organization_id,
        requesterName: input.contactName,
        requesterEmail: input.contactEmail,
        currentPlan,
        requestedPlan: input.requestedPlan,
        seats: input.seats,
        message: input.message,
        requestId: newRequest.id,
      })
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Error sending upgrade request email:', emailError)
    }

    return {
      success: true,
      message: 'Solicitud enviada exitosamente',
      data: {
        id: newRequest.id,
        status: newRequest.status as UpgradeRequestStatus,
      },
    }
  } catch (error) {
    console.error('Error in createUpgradeRequest:', error)
    return { success: false, message: 'Error al procesar la solicitud' }
  }
}

// =============================================================================
// GET LATEST UPGRADE REQUEST
// =============================================================================

export async function getLatestUpgradeRequest(): Promise<ActionResult<UpgradeRequest | null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'No autenticado' }
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, message: 'No se encontro la organizacion' }
    }

    // Get the latest upgrade request
    const { data: request, error } = await supabase
      .from('upgrade_requests')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching upgrade request:', error)
      return { success: false, message: 'Error al obtener la solicitud' }
    }

    return {
      success: true,
      message: 'OK',
      data: (request || null) as UpgradeRequest | null,
    }
  } catch (error) {
    console.error('Error in getLatestUpgradeRequest:', error)
    return { success: false, message: 'Error al obtener la solicitud' }
  }
}

// =============================================================================
// GET ALL UPGRADE REQUESTS FOR ORG
// =============================================================================

export async function getUpgradeRequests(): Promise<ActionResult<UpgradeRequest[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'No autenticado' }
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, message: 'No se encontro la organizacion' }
    }

    // Get all upgrade requests for this organization
    const { data: requests, error } = await supabase
      .from('upgrade_requests')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching upgrade requests:', error)
      return { success: false, message: 'Error al obtener las solicitudes' }
    }

    return {
      success: true,
      message: 'OK',
      data: (requests || []) as UpgradeRequest[],
    }
  } catch (error) {
    console.error('Error in getUpgradeRequests:', error)
    return { success: false, message: 'Error al obtener las solicitudes' }
  }
}

// =============================================================================
// EMAIL NOTIFICATION
// =============================================================================

interface UpgradeRequestEmailData {
  organizationName: string
  organizationId: string
  requesterName: string
  requesterEmail: string
  currentPlan: string
  requestedPlan: string
  seats?: number | null
  message?: string | null
  requestId: string
}

async function sendUpgradeRequestEmail(data: UpgradeRequestEmailData): Promise<void> {
  const planInfo = PRICING_PLANS.find(p => p.id === data.requestedPlan)
  const currentPlanInfo = PRICING_PLANS.find(p => p.id === data.currentPlan)

  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.gymgo.io'
  const orgLink = `${dashboardUrl}/admin/organizations/${data.organizationId}`

  const subject = `[GymGo] Nueva solicitud de upgrade: ${data.organizationName}`

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud de Upgrade</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #e4e4e7;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                      Nueva Solicitud de Upgrade
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
                      ${new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px 40px;">
                    <!-- Organization Info -->
                    <div style="margin-bottom: 24px;">
                      <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                        Gimnasio
                      </h2>
                      <p style="margin: 0; font-size: 14px; color: #52525b;">
                        <strong>${data.organizationName}</strong><br>
                        ID: ${data.organizationId}
                      </p>
                    </div>

                    <!-- Requester Info -->
                    <div style="margin-bottom: 24px;">
                      <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                        Solicitante
                      </h2>
                      <p style="margin: 0; font-size: 14px; color: #52525b;">
                        ${data.requesterName}<br>
                        <a href="mailto:${data.requesterEmail}" style="color: #84cc16;">${data.requesterEmail}</a>
                      </p>
                    </div>

                    <!-- Plan Change -->
                    <div style="margin-bottom: 24px; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
                      <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                        Cambio de Plan
                      </h2>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Plan Actual:</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #18181b; font-weight: 500; text-align: right;">
                            ${currentPlanInfo?.name || data.currentPlan}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Plan Solicitado:</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #84cc16; font-weight: 600; text-align: right;">
                            ${planInfo?.name || data.requestedPlan}
                            ${planInfo ? ` ($${planInfo.priceMonthlyUSD}/mes)` : ''}
                          </td>
                        </tr>
                        ${data.seats ? `
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Miembros/Seats:</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #18181b; font-weight: 500; text-align: right;">
                            ${data.seats}
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>

                    ${data.message ? `
                    <!-- Message -->
                    <div style="margin-bottom: 24px;">
                      <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                        Mensaje
                      </h2>
                      <p style="margin: 0; font-size: 14px; color: #52525b; white-space: pre-wrap;">
                        ${data.message}
                      </p>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa;">
                      Request ID: ${data.requestId}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      Este email fue enviado automaticamente por GymGo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const textContent = `
Nueva Solicitud de Upgrade - GymGo

Fecha: ${new Date().toLocaleString('es-MX')}

GIMNASIO
${data.organizationName}
ID: ${data.organizationId}

SOLICITANTE
${data.requesterName}
${data.requesterEmail}

CAMBIO DE PLAN
Plan Actual: ${currentPlanInfo?.name || data.currentPlan}
Plan Solicitado: ${planInfo?.name || data.requestedPlan}${planInfo ? ` ($${planInfo.priceMonthlyUSD}/mes)` : ''}
${data.seats ? `Miembros/Seats: ${data.seats}` : ''}

${data.message ? `MENSAJE:\n${data.message}` : ''}

---
Request ID: ${data.requestId}
  `.trim()

  const { error } = await resend.emails.send({
    from: emailConfig.from,
    to: 'jcampos@gymgo.io',
    replyTo: data.requesterEmail,
    subject,
    html: htmlContent,
    text: textContent,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
