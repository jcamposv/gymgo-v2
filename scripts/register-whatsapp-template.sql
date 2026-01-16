-- =============================================================================
-- SCRIPT: Registrar Template de WhatsApp Aprobado
-- Usar despues de que el template sea aprobado en Twilio
-- =============================================================================

-- PASO 1: Obtener el Content SID del template aprobado en Twilio Console
-- Ve a: Twilio Console → Messaging → Content Template Builder → Tu template
-- Copia el "Content SID" (empieza con HX...)

-- PASO 2: Registrar en la base de datos

DO $$
DECLARE
  v_org_id UUID := 'REEMPLAZA_CON_ORGANIZATION_ID';
  v_content_sid TEXT := 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';  -- Content SID de Twilio
  v_template_name TEXT := 'gymgo_payment_reminder';            -- Nombre en Twilio
BEGIN
  -- Actualizar template existente con el SID de Twilio
  UPDATE whatsapp_templates
  SET
    twilio_content_sid = v_content_sid,
    twilio_template_name = v_template_name,
    status = 'approved',
    updated_at = NOW()
  WHERE organization_id = v_org_id
    AND template_type = 'payment_reminder'  -- Cambiar segun el tipo
    AND is_default = true;

  -- Si no existe, crearlo
  IF NOT FOUND THEN
    INSERT INTO whatsapp_templates (
      organization_id,
      name,
      template_type,
      language,
      body_text,
      variables,
      is_default,
      status,
      twilio_content_sid,
      twilio_template_name
    ) VALUES (
      v_org_id,
      'Recordatorio de Pago',
      'payment_reminder',
      'es',
      'Hola {{1}}, te recordamos que tu pago de {{2}} vence en {{3}} dias. Plan: {{4}}. Gracias por ser parte de nuestra comunidad.',
      '[{"key": "member_name", "type": "text", "example": "Juan"}, {"key": "amount", "type": "currency", "example": "$500"}, {"key": "days", "type": "text", "example": "3"}, {"key": "plan_name", "type": "text", "example": "Mensual"}]'::jsonb,
      true,
      'approved',
      v_content_sid,
      v_template_name
    );
  END IF;

  RAISE NOTICE 'Template registrado correctamente';
END $$;

-- =============================================================================
-- TEMPLATES COMUNES PARA APROBAR EN TWILIO
-- =============================================================================

/*
TEMPLATE 1: Recordatorio de Pago (payment_reminder)
--------------------------------------------------
Category: UTILITY
Language: es

Body:
Hola {{1}}, te recordamos que tu pago vence en {{2}} días.

Monto: {{3}}
Plan: {{4}}

Gracias por ser parte de nuestra comunidad.

Variables:
1 = member_name (Juan)
2 = days_until_due (3)
3 = amount ($500.00 MXN)
4 = plan_name (Mensual)


TEMPLATE 2: Pago Vencido (payment_overdue)
--------------------------------------------------
Category: UTILITY
Language: es

Body:
Hola {{1}}, tu membresía ha vencido el {{2}}.

Para continuar disfrutando de nuestros servicios, te invitamos a renovar.

Monto pendiente: {{3}}

Variables:
1 = member_name (Juan)
2 = expiry_date (15/01/2026)
3 = amount ($500.00 MXN)


TEMPLATE 3: Confirmación de Pago (payment_confirmation)
--------------------------------------------------
Category: UTILITY
Language: es

Body:
Hola {{1}}, hemos recibido tu pago.

Monto: {{2}}
Plan: {{3}}
Vigencia hasta: {{4}}

¡Gracias por tu preferencia!

Variables:
1 = member_name (Juan)
2 = amount ($500.00 MXN)
3 = plan_name (Mensual)
4 = expiry_date (15/02/2026)


TEMPLATE 4: Bienvenida (welcome)
--------------------------------------------------
Category: UTILITY
Language: es

Body:
¡Bienvenido {{1}} a {{2}}!

Tu membresía {{3}} está activa.

Horarios: {{4}}

¡Te esperamos!

Variables:
1 = member_name (Juan)
2 = gym_name (PowerFit Gym)
3 = plan_name (Mensual)
4 = gym_hours (Lun-Vie 6am-10pm)

*/

-- =============================================================================
-- VERIFICAR TEMPLATES
-- =============================================================================

-- SELECT
--   name,
--   template_type,
--   status,
--   twilio_content_sid,
--   created_at
-- FROM whatsapp_templates
-- WHERE organization_id = 'TU_ORG_ID'
-- ORDER BY template_type;
