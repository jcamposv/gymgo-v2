-- =============================================================================
-- SCRIPT: Activar WhatsApp para un Gimnasio
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- PASO 1: Encontrar el organization_id del gimnasio
-- Descomenta y ejecuta primero para ver los gimnasios disponibles:

-- SELECT id, name, slug FROM organizations;

-- =============================================================================
-- PASO 2: Activar WhatsApp (reemplaza los valores)
-- =============================================================================

-- Configuracion - EDITA ESTOS VALORES
DO $$
DECLARE
  v_org_id UUID := 'YOUR_ORGANIZATION_ID_HERE';           -- UUID del gimnasio
  v_twilio_sid TEXT := 'YOUR_TWILIO_ACCOUNT_SID_HERE';    -- Account SID de Twilio
  v_twilio_token TEXT := 'YOUR_TWILIO_AUTH_TOKEN_HERE';   -- Auth Token de Twilio
  v_whatsapp_number TEXT := '+14155238886';               -- Numero de WhatsApp (sandbox o produccion)
  v_gym_name TEXT := 'Mi Gimnasio';                       -- Nombre para identificar
BEGIN
  -- Insertar configuracion de WhatsApp
  INSERT INTO gym_whatsapp_settings (
    organization_id,
    twilio_account_sid,
    twilio_auth_token,
    twilio_subaccount_name,
    whatsapp_phone_number,
    is_enabled,
    setup_status,
    reminder_days_before,
    reminder_hour,
    send_payment_confirmation,
    send_membership_expiry_warning,
    auto_opt_in_new_members
  ) VALUES (
    v_org_id,
    v_twilio_sid,
    v_twilio_token,
    'GymGo - ' || v_gym_name,
    v_whatsapp_number,
    true,
    'active',
    ARRAY[3, 1, 0],  -- Recordatorios: 3 dias, 1 dia, y dia del vencimiento
    9,               -- Hora de envio: 9 AM
    true,            -- Enviar confirmacion de pago
    true,            -- Enviar aviso de vencimiento
    true             -- Auto opt-in nuevos miembros
  )
  ON CONFLICT (organization_id)
  DO UPDATE SET
    twilio_account_sid = EXCLUDED.twilio_account_sid,
    twilio_auth_token = EXCLUDED.twilio_auth_token,
    whatsapp_phone_number = EXCLUDED.whatsapp_phone_number,
    setup_status = 'active',
    is_enabled = true,
    updated_at = NOW();

  RAISE NOTICE 'WhatsApp activado para organizacion: %', v_org_id;
END $$;

-- =============================================================================
-- PASO 3: Crear Templates por defecto (opcional)
-- =============================================================================

-- Descomenta y ejecuta despues de activar WhatsApp

/*
DO $$
DECLARE
  v_org_id UUID := 'REEMPLAZA_CON_ORGANIZATION_ID';  -- Mismo UUID de arriba
BEGIN
  -- Template: Recordatorio de Pago
  INSERT INTO whatsapp_templates (
    organization_id,
    name,
    template_type,
    language,
    body_text,
    variables,
    is_default,
    status
  ) VALUES (
    v_org_id,
    'Recordatorio de Pago',
    'payment_reminder',
    'es',
    'Hola {{1}}, te recordamos que tu pago vence en {{2}} dias. Monto: {{3}}. Gracias por ser parte de nuestra comunidad!',
    '[{"key": "member_name", "type": "text", "example": "Juan"}, {"key": "days_until_due", "type": "text", "example": "3"}, {"key": "amount", "type": "currency", "example": "$500.00"}]'::jsonb,
    true,
    'draft'
  ) ON CONFLICT DO NOTHING;

  -- Template: Pago Vencido
  INSERT INTO whatsapp_templates (
    organization_id,
    name,
    template_type,
    language,
    body_text,
    variables,
    is_default,
    status
  ) VALUES (
    v_org_id,
    'Pago Vencido',
    'payment_overdue',
    'es',
    'Hola {{1}}, tu membresia ha vencido. Renueva ahora para seguir disfrutando de nuestros servicios. Monto pendiente: {{2}}.',
    '[{"key": "member_name", "type": "text", "example": "Juan"}, {"key": "amount", "type": "currency", "example": "$500.00"}]'::jsonb,
    true,
    'draft'
  ) ON CONFLICT DO NOTHING;

  -- Template: Confirmacion de Pago
  INSERT INTO whatsapp_templates (
    organization_id,
    name,
    template_type,
    language,
    body_text,
    variables,
    is_default,
    status
  ) VALUES (
    v_org_id,
    'Confirmacion de Pago',
    'payment_confirmation',
    'es',
    'Hola {{1}}, hemos recibido tu pago de {{2}}. Tu membresia esta activa hasta el {{3}}. Gracias!',
    '[{"key": "member_name", "type": "text", "example": "Juan"}, {"key": "amount", "type": "currency", "example": "$500.00"}, {"key": "expiry_date", "type": "date", "example": "15/02/2026"}]'::jsonb,
    true,
    'draft'
  ) ON CONFLICT DO NOTHING;

  -- Template: Bienvenida
  INSERT INTO whatsapp_templates (
    organization_id,
    name,
    template_type,
    language,
    body_text,
    variables,
    is_default,
    status
  ) VALUES (
    v_org_id,
    'Bienvenida',
    'welcome',
    'es',
    'Bienvenido {{1}} a {{2}}! Estamos felices de tenerte. Tu membresia {{3}} esta activa. Cualquier duda estamos para ayudarte.',
    '[{"key": "member_name", "type": "text", "example": "Juan"}, {"key": "gym_name", "type": "text", "example": "PowerFit Gym"}, {"key": "plan_name", "type": "text", "example": "Mensual"}]'::jsonb,
    true,
    'draft'
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Templates creados para organizacion: %', v_org_id;
END $$;
*/

-- =============================================================================
-- VERIFICAR
-- =============================================================================

-- Ver configuracion creada:
-- SELECT * FROM gym_whatsapp_settings WHERE organization_id = 'TU_ORG_ID';

-- Ver templates creados:
-- SELECT id, name, template_type, status FROM whatsapp_templates WHERE organization_id = 'TU_ORG_ID';
