'use server'

/**
 * WhatsApp Server Actions
 *
 * Handles WhatsApp settings, templates, and message sending via Twilio.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission, requireAdmin } from '@/lib/auth/server-auth'
import {
  whatsappSettingsSchema,
  whatsappTemplateSchema,
  testSendSchema,
  deliveryLogFiltersSchema,
  type WhatsAppSettingsFormData,
  type WhatsAppTemplateFormData,
  type TestSendFormData,
} from '@/schemas/whatsapp.schema'
import {
  subaccountService,
  contentService,
  messagingService,
  sendSandboxMessage,
  isTwilioConfigured,
} from '@/lib/twilio'
import type {
  GymWhatsAppSettings,
  WhatsAppTemplate,
  MemberNotificationPreferences,
  NotificationDeliveryLog,
  DeliveryLogFilters,
} from '@/types/whatsapp.types'

// Note: The database types haven't been regenerated yet to include the new WhatsApp tables.
// Use type assertions (`as any`) for now until `supabase gen types typescript` is run
// after applying the 013_whatsapp_module.sql migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untypedClient = (client: any): AnyClient => client

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

function successResponse<T>(data?: T, message?: string): ActionResponse<T> {
  return { success: true, data, error: message }
}

function errorResponse<T = unknown>(error: string, fieldErrors?: Record<string, string[]>): ActionResponse<T> {
  return { success: false, error, fieldErrors }
}

// =============================================================================
// SETTINGS ACTIONS
// =============================================================================

/**
 * Get WhatsApp settings for the current organization
 */
export async function getWhatsAppSettings(): Promise<{
  data: GymWhatsAppSettings | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .select('*')
    .eq('organization_id', user.organizationId)
    .single()

  // PGRST116 = Row not found (not an error, just no settings yet)
  if (dbError && dbError.code !== 'PGRST116') {
    return { data: null, error: dbError.message }
  }

  return { data: data as GymWhatsAppSettings | null, error: null }
}

/**
 * Initialize WhatsApp settings and create Twilio subaccount
 */
export async function initializeWhatsAppSettings(): Promise<ActionResponse<GymWhatsAppSettings>> {
  // Check Twilio is configured
  if (!isTwilioConfigured()) {
    return errorResponse('Twilio no esta configurado en el servidor')
  }

  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const supabase = await createClient()

  // Check if settings already exist
  const { data: existing } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .select('id')
    .eq('organization_id', user.organizationId)
    .single()

  if (existing) {
    return errorResponse('La configuracion de WhatsApp ya existe')
  }

  // Get organization name for subaccount
  const { data: org } = await supabase
    .from('organizations')
    .select('name, slug')
    .eq('id', user.organizationId)
    .single()

  if (!org) {
    return errorResponse('Organizacion no encontrada')
  }

  const orgData = org as { name: string; slug: string }

  try {
    // Create Twilio subaccount
    const subaccount = await subaccountService.createSubaccount({
      friendlyName: `GymGo - ${orgData.name}`,
    })

    // Save settings with service role to bypass RLS for insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings, error: insertError } = await (supabase as any)
      .from('gym_whatsapp_settings')
      .insert({
        organization_id: user.organizationId,
        twilio_account_sid: subaccount.accountSid,
        twilio_auth_token: subaccount.authToken,
        twilio_subaccount_name: subaccount.friendlyName,
        setup_status: 'phone_pending',
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Try to cleanup the subaccount if DB insert fails
      try {
        await subaccountService.suspendSubaccount(subaccount.accountSid)
      } catch {
        // Ignore cleanup errors
      }
      return errorResponse(`Error al guardar configuracion: ${insertError.message}`)
    }

    // Create default templates (drafts)
    await createDefaultTemplates(supabase, user.organizationId, user.id)

    revalidatePath('/dashboard/settings/whatsapp')
    return successResponse(settings as GymWhatsAppSettings, 'WhatsApp inicializado correctamente')
  } catch (err) {
    const error = err as Error
    console.error('Error initializing WhatsApp:', error)
    return errorResponse(`Error al crear subcuenta Twilio: ${error.message}`)
  }
}

/**
 * Update WhatsApp settings
 */
export async function updateWhatsAppSettings(
  data: WhatsAppSettingsFormData
): Promise<ActionResponse> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const validated = whatsappSettingsSchema.safeParse(data)

  if (!validated.success) {
    return errorResponse('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  const { error: updateError } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', user.organizationId)

  if (updateError) {
    return errorResponse(updateError.message)
  }

  revalidatePath('/dashboard/settings/whatsapp')
  return successResponse(undefined, 'Configuracion actualizada')
}

/**
 * Update WhatsApp phone number (after Twilio setup)
 */
export async function updateWhatsAppPhoneNumber(
  phoneNumber: string,
  senderSid?: string
): Promise<ActionResponse> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const supabase = await createClient()

  const { error: updateError } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .update({
      whatsapp_phone_number: phoneNumber,
      whatsapp_sender_sid: senderSid,
      setup_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', user.organizationId)

  if (updateError) {
    return errorResponse(updateError.message)
  }

  revalidatePath('/dashboard/settings/whatsapp')
  return successResponse(undefined, 'Numero de WhatsApp configurado')
}

// =============================================================================
// TEMPLATE ACTIONS
// =============================================================================

/**
 * Get all WhatsApp templates for the organization
 */
export async function getWhatsAppTemplates(): Promise<{
  data: WhatsAppTemplate[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await (supabase as AnyClient)
    .from('whatsapp_templates')
    .select('*')
    .eq('organization_id', user.organizationId)
    .order('template_type', { ascending: true })
    .order('is_default', { ascending: false })

  if (dbError) {
    return { data: null, error: dbError.message }
  }

  return { data: data as WhatsAppTemplate[], error: null }
}

/**
 * Create a new WhatsApp template
 */
export async function createWhatsAppTemplate(
  data: WhatsAppTemplateFormData
): Promise<ActionResponse<WhatsAppTemplate>> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const validated = whatsappTemplateSchema.safeParse(data)

  if (!validated.success) {
    return errorResponse('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  // Get Twilio credentials
  const { data: settings } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .select('twilio_account_sid, twilio_auth_token, setup_status')
    .eq('organization_id', user.organizationId)
    .single()

  if (!settings) {
    return errorResponse('WhatsApp no configurado. Inicializa primero.')
  }

  const settingsData = settings as {
    twilio_account_sid: string
    twilio_auth_token: string
    setup_status: string
  }

  try {
    // Create template in Twilio Content API
    const templateName = `gymgo_${user.organizationId.slice(0, 8)}_${validated.data.template_type}_${Date.now()}`

    const twilioResult = await contentService.createTemplate(
      {
        accountSid: settingsData.twilio_account_sid,
        authToken: settingsData.twilio_auth_token,
      },
      {
        friendlyName: templateName,
        language: validated.data.language || 'es',
        variables: validated.data.variables?.reduce(
          (acc, v, i) => ({
            ...acc,
            [(i + 1).toString()]: v.example,
          }),
          {}
        ),
        types: {
          'twilio/text': {
            body: validated.data.body_text,
          },
        },
      }
    )

    // Save to database
    const { data: template, error: insertError } = await (supabase as AnyClient)
      .from('whatsapp_templates')
      .insert({
        organization_id: user.organizationId,
        name: validated.data.name,
        template_type: validated.data.template_type,
        language: validated.data.language || 'es',
        header_text: validated.data.header_text,
        body_text: validated.data.body_text,
        footer_text: validated.data.footer_text,
        variables: validated.data.variables || [],
        cta_buttons: validated.data.cta_buttons || [],
        is_default: validated.data.is_default || false,
        twilio_content_sid: twilioResult.sid,
        twilio_template_name: twilioResult.friendlyName,
        status: 'pending_approval',
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Cleanup Twilio template if DB insert fails
      try {
        await contentService.deleteTemplate(
          {
            accountSid: settingsData.twilio_account_sid,
            authToken: settingsData.twilio_auth_token,
          },
          twilioResult.sid
        )
      } catch {
        // Ignore cleanup errors
      }
      return errorResponse(insertError.message)
    }

    revalidatePath('/dashboard/settings/whatsapp/templates')
    return successResponse(
      template as WhatsAppTemplate,
      'Plantilla creada y enviada para aprobacion'
    )
  } catch (err) {
    const error = err as Error
    console.error('Error creating template:', error)
    return errorResponse(`Error al crear plantilla: ${error.message}`)
  }
}

/**
 * Update a template (local fields only, not Twilio content)
 */
export async function updateWhatsAppTemplate(
  templateId: string,
  data: Partial<WhatsAppTemplateFormData>
): Promise<ActionResponse> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  // Only allow updating local fields
  const allowedFields = ['name', 'is_default']
  const hasContentChanges = Object.keys(data).some((key) => !allowedFields.includes(key))

  if (hasContentChanges) {
    return errorResponse(
      'Para cambiar el contenido del mensaje, elimina esta plantilla y crea una nueva'
    )
  }

  const supabase = await createClient()

  const { error: updateError } = await (supabase as AnyClient)
    .from('whatsapp_templates')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .eq('organization_id', user.organizationId)

  if (updateError) {
    return errorResponse(updateError.message)
  }

  revalidatePath('/dashboard/settings/whatsapp/templates')
  return successResponse(undefined, 'Plantilla actualizada')
}

/**
 * Delete a template
 */
export async function deleteWhatsAppTemplate(templateId: string): Promise<ActionResponse> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const supabase = await createClient()

  // Get template and settings
  const { data: template } = await (supabase as AnyClient)
    .from('whatsapp_templates')
    .select('twilio_content_sid')
    .eq('id', templateId)
    .eq('organization_id', user.organizationId)
    .single()

  const { data: settings } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .select('twilio_account_sid, twilio_auth_token')
    .eq('organization_id', user.organizationId)
    .single()

  if (!template) {
    return errorResponse('Plantilla no encontrada')
  }

  const templateData = template as { twilio_content_sid: string | null }
  const settingsData = settings as { twilio_account_sid: string; twilio_auth_token: string } | null

  try {
    // Delete from Twilio if we have the SID
    if (templateData.twilio_content_sid && settingsData) {
      await contentService.deleteTemplate(
        {
          accountSid: settingsData.twilio_account_sid,
          authToken: settingsData.twilio_auth_token,
        },
        templateData.twilio_content_sid
      )
    }

    // Delete from database
    const { error: deleteError } = await (supabase as AnyClient)
      .from('whatsapp_templates')
      .delete()
      .eq('id', templateId)
      .eq('organization_id', user.organizationId)

    if (deleteError) {
      return errorResponse(deleteError.message)
    }

    revalidatePath('/dashboard/settings/whatsapp/templates')
    return successResponse(undefined, 'Plantilla eliminada')
  } catch (err) {
    const error = err as Error
    console.error('Error deleting template:', error)
    return errorResponse(`Error al eliminar: ${error.message}`)
  }
}

/**
 * Sync template approval status from Twilio
 */
export async function syncTemplateStatus(templateId: string): Promise<ActionResponse> {
  const { authorized, user, error } = await requirePermission('manage_gym_settings')

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const supabase = await createClient()

  // Get template and settings
  const { data: template } = await (supabase as AnyClient)
    .from('whatsapp_templates')
    .select('twilio_content_sid')
    .eq('id', templateId)
    .eq('organization_id', user.organizationId)
    .single()

  const { data: settings } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .select('twilio_account_sid, twilio_auth_token')
    .eq('organization_id', user.organizationId)
    .single()

  if (!template || !settings) {
    return errorResponse('Plantilla o configuracion no encontrada')
  }

  const templateData = template as { twilio_content_sid: string | null }
  const settingsData = settings as { twilio_account_sid: string; twilio_auth_token: string }

  if (!templateData.twilio_content_sid) {
    return errorResponse('Plantilla sin Content SID')
  }

  try {
    const approvalStatus = await contentService.getApprovalStatus(
      {
        accountSid: settingsData.twilio_account_sid,
        authToken: settingsData.twilio_auth_token,
      },
      templateData.twilio_content_sid
    )

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      pending: 'pending_approval',
      approved: 'approved',
      rejected: 'rejected',
    }

    const newStatus = statusMap[approvalStatus.status] || 'pending_approval'

    await (supabase as AnyClient)
      .from('whatsapp_templates')
      .update({
        status: newStatus,
        rejection_reason: approvalStatus.rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    revalidatePath('/dashboard/settings/whatsapp/templates')
    return successResponse(undefined, `Estado actualizado: ${newStatus}`)
  } catch (err) {
    const error = err as Error
    return errorResponse(`Error al sincronizar: ${error.message}`)
  }
}

// =============================================================================
// TEST SEND ACTION
// =============================================================================

/**
 * Send a test WhatsApp message
 */
export async function sendTestWhatsAppMessage(
  data: TestSendFormData
): Promise<ActionResponse<{ messageSid: string }>> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const validated = testSendSchema.safeParse(data)

  if (!validated.success) {
    return errorResponse('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  // Get settings and template
  const { data: settings } = await (supabase as AnyClient)
    .from('gym_whatsapp_settings')
    .select('twilio_account_sid, twilio_auth_token, whatsapp_sender_sid, setup_status')
    .eq('organization_id', user.organizationId)
    .single()

  const { data: template } = await (supabase as AnyClient)
    .from('whatsapp_templates')
    .select('twilio_content_sid, status')
    .eq('id', validated.data.template_id)
    .eq('organization_id', user.organizationId)
    .single()

  if (!settings || !template) {
    return errorResponse('Configuracion o plantilla no encontrada')
  }

  const settingsData = settings as {
    twilio_account_sid: string
    twilio_auth_token: string
    whatsapp_sender_sid: string | null
    setup_status: string
  }

  const templateData = template as {
    twilio_content_sid: string | null
    status: string
  }

  if (settingsData.setup_status !== 'active') {
    return errorResponse('WhatsApp no esta completamente configurado')
  }

  if (templateData.status !== 'approved') {
    return errorResponse('La plantilla debe estar aprobada para enviar mensajes')
  }

  if (!templateData.twilio_content_sid) {
    return errorResponse('La plantilla no tiene Content SID')
  }

  if (!settingsData.whatsapp_sender_sid) {
    return errorResponse('No hay numero de WhatsApp configurado')
  }

  try {
    const result = await messagingService.sendWhatsAppTemplate(
      {
        accountSid: settingsData.twilio_account_sid,
        authToken: settingsData.twilio_auth_token,
      },
      {
        to: validated.data.phone_number,
        contentSid: templateData.twilio_content_sid,
        contentVariables: validated.data.variables as Record<string, string> | undefined,
        messagingServiceSid: settingsData.whatsapp_sender_sid,
      }
    )

    if (result.errorCode) {
      return errorResponse(`Error de Twilio: ${result.errorMessage}`)
    }

    // Log the test message
    await (supabase as AnyClient).from('notification_delivery_log').insert({
      organization_id: user.organizationId,
      channel: 'whatsapp',
      notification_type: 'test_message',
      template_id: validated.data.template_id,
      body: 'Test message',
      variables_used: validated.data.variables || null,
      recipient_phone: validated.data.phone_number,
      provider: 'twilio',
      provider_message_id: result.messageSid,
      provider_status: result.status,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return successResponse(
      { messageSid: result.messageSid },
      'Mensaje de prueba enviado'
    )
  } catch (err) {
    const error = err as Error
    console.error('Error sending test message:', error)
    return errorResponse(`Error al enviar: ${error.message}`)
  }
}

// =============================================================================
// DELIVERY LOG ACTIONS
// =============================================================================

/**
 * Get notification delivery logs
 */
export async function getDeliveryLogs(filters: DeliveryLogFilters = {}): Promise<{
  data: NotificationDeliveryLog[] | null
  total: number
  error: string | null
}> {
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return { data: null, total: 0, error: error || 'No autorizado' }
  }

  const validated = deliveryLogFiltersSchema.safeParse(filters)
  const params = validated.success ? validated.data : { page: 1, limit: 20 }

  const supabase = await createClient()

  let query = supabase
    .from('notification_delivery_log')
    .select('*', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (params.channel) {
    query = query.eq('channel', params.channel)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.notification_type) {
    query = query.eq('notification_type', params.notification_type)
  }
  if (params.member_id) {
    query = query.eq('member_id', params.member_id)
  }
  if (params.from_date) {
    query = query.gte('created_at', params.from_date)
  }
  if (params.to_date) {
    query = query.lte('created_at', params.to_date)
  }

  // Pagination
  const offset = ((params.page || 1) - 1) * (params.limit || 20)
  query = query.range(offset, offset + (params.limit || 20) - 1)

  const { data, count, error: dbError } = await query

  if (dbError) {
    return { data: null, total: 0, error: dbError.message }
  }

  return {
    data: data as NotificationDeliveryLog[],
    total: count || 0,
    error: null,
  }
}

// =============================================================================
// MEMBER NOTIFICATION PREFERENCES ACTIONS
// =============================================================================

/**
 * Get notification preferences for a member
 */
export async function getMemberNotificationPreferences(
  memberId: string
): Promise<{
  data: MemberNotificationPreferences | null
  error: string | null
}> {
  const { authorized, user, error } = await requirePermission('view_members')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  const { data, error: dbError } = await (supabase as AnyClient)
    .from('member_notification_preferences')
    .select('*')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .single()

  if (dbError && dbError.code !== 'PGRST116') {
    return { data: null, error: dbError.message }
  }

  return { data: data as MemberNotificationPreferences | null, error: null }
}

/**
 * Update notification preferences for a member
 */
export async function updateMemberNotificationPreferences(
  memberId: string,
  data: Partial<MemberNotificationPreferences>
): Promise<ActionResponse> {
  const { authorized, user, error } = await requirePermission('manage_members')

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  const supabase = await createClient()

  // Check if preferences exist
  const { data: existing } = await (supabase as AnyClient)
    .from('member_notification_preferences')
    .select('id')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .single()

  if (existing) {
    // Update existing
    const { error: updateError } = await (supabase as AnyClient)
      .from('member_notification_preferences')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('member_id', memberId)
      .eq('organization_id', user.organizationId)

    if (updateError) {
      return errorResponse(updateError.message)
    }
  } else {
    // Create new
    const { error: insertError } = await (supabase as AnyClient)
      .from('member_notification_preferences')
      .insert({
        member_id: memberId,
        organization_id: user.organizationId,
        ...data,
      })

    if (insertError) {
      return errorResponse(insertError.message)
    }
  }

  return successResponse(undefined, 'Preferencias actualizadas')
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// =============================================================================
// SANDBOX TEST ACTION
// =============================================================================

/**
 * Send a test message via WhatsApp Sandbox (development only)
 */
export async function sendSandboxTestMessage(
  phoneNumber: string,
  message?: string
): Promise<ActionResponse<{ messageSid: string }>> {
  // Only allow in development or for super admins
  const { authorized, user, error } = await requireAdmin()

  if (!authorized || !user) {
    return errorResponse(error || 'No autorizado')
  }

  if (!isTwilioConfigured()) {
    return errorResponse('Twilio no esta configurado. Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN.')
  }

  // Clean phone number
  const cleanPhone = phoneNumber.replace(/\s/g, '')
  if (!cleanPhone.startsWith('+')) {
    return errorResponse('El numero debe incluir codigo de pais (ej: +521234567890)')
  }

  try {
    const result = await sendSandboxMessage({
      to: cleanPhone,
      body: message || `Prueba de GymGo WhatsApp - ${new Date().toLocaleString('es-MX')}`,
    })

    if (result.errorCode) {
      return errorResponse(`Error de Twilio (${result.errorCode}): ${result.errorMessage}`)
    }

    return successResponse(
      { messageSid: result.messageSid },
      'Mensaje de prueba enviado'
    )
  } catch (err) {
    const error = err as Error
    console.error('Error sending sandbox message:', error)
    return errorResponse(`Error: ${error.message}`)
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create default template drafts for a new organization
 */
async function createDefaultTemplates(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  organizationId: string,
  userId: string
) {
  const defaultTemplates = [
    {
      name: 'Recordatorio de Pago',
      template_type: 'payment_reminder',
      body_text:
        'Hola {{1}}, te recordamos que tu pago vence en {{2}} dias. Monto: {{3}} por el plan {{4}}. Gracias por ser parte de nuestra comunidad!',
      variables: [
        { key: 'member_name', type: 'text', example: 'Juan' },
        { key: 'days_until_due', type: 'text', example: '3' },
        { key: 'amount', type: 'currency', example: 'MXN 500.00' },
        { key: 'plan_name', type: 'text', example: 'Mensual' },
      ],
      is_default: true,
    },
    {
      name: 'Pago Vencido',
      template_type: 'payment_overdue',
      body_text:
        'Hola {{1}}, tu membresia ha vencido. Renueva ahora para seguir disfrutando de nuestros servicios. Plan: {{2}}, Monto: {{3}}.',
      variables: [
        { key: 'member_name', type: 'text', example: 'Juan' },
        { key: 'plan_name', type: 'text', example: 'Mensual' },
        { key: 'amount', type: 'currency', example: 'MXN 500.00' },
      ],
      is_default: true,
    },
    {
      name: 'Confirmacion de Pago',
      template_type: 'payment_confirmation',
      body_text:
        'Hola {{1}}, hemos recibido tu pago de {{2}}. Tu membresia esta activa hasta el {{3}}. Gracias!',
      variables: [
        { key: 'member_name', type: 'text', example: 'Juan' },
        { key: 'amount', type: 'currency', example: 'MXN 500.00' },
        { key: 'expiry_date', type: 'date', example: '15/02/2026' },
      ],
      is_default: true,
    },
  ]

  for (const template of defaultTemplates) {
    await (supabase as AnyClient).from('whatsapp_templates').insert({
      organization_id: organizationId,
      ...template,
      language: 'es',
      status: 'draft',
      created_by: userId,
    })
  }
}
