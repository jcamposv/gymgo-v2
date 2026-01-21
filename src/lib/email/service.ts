import { resend, emailConfig, type SendEmailResult } from './resend'
import {
  generateInvitationEmailHtml,
  generateInvitationEmailText,
  type InvitationEmailProps,
} from './templates/invitation'
import { checkEmailLimit, consumeEmail } from '@/lib/plan-limits'

// =============================================================================
// EMAIL SERVICE
// =============================================================================

/**
 * Sends a member invitation email
 * @param organizationId - Optional org ID for tracking email usage limits
 */
export async function sendInvitationEmail(
  to: string,
  props: InvitationEmailProps,
  organizationId?: string
): Promise<SendEmailResult> {
  // Check email limit if organizationId provided
  if (organizationId) {
    const limitCheck = await checkEmailLimit(organizationId)
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.message || 'Límite de emails alcanzado',
      }
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to,
      replyTo: emailConfig.replyTo,
      subject: `Te han invitado a ${props.gymName}`,
      html: generateInvitationEmailHtml(props),
      text: generateInvitationEmailText(props),
    })

    if (error) {
      console.error('Resend error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Track email usage
    if (organizationId) {
      await consumeEmail(organizationId, 1)
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (err) {
    console.error('Email send error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al enviar el correo',
    }
  }
}

/**
 * Sends a password reset email (custom branded version)
 * @param organizationId - Optional org ID for tracking email usage limits
 */
export async function sendPasswordResetEmail(
  to: string,
  props: {
    memberName: string
    gymName: string
    gymLogoUrl: string | null
    resetUrl: string
  },
  organizationId?: string
): Promise<SendEmailResult> {
  // Check email limit if organizationId provided
  if (organizationId) {
    const limitCheck = await checkEmailLimit(organizationId)
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.message || 'Límite de emails alcanzado',
      }
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to,
      replyTo: emailConfig.replyTo,
      subject: `Restablecer contraseña - ${props.gymName}`,
      html: generatePasswordResetEmailHtml(props),
      text: generatePasswordResetEmailText(props),
    })

    if (error) {
      console.error('Resend error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Track email usage
    if (organizationId) {
      await consumeEmail(organizationId, 1)
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (err) {
    console.error('Email send error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al enviar el correo',
    }
  }
}

// =============================================================================
// PASSWORD RESET EMAIL TEMPLATE (inline for simplicity)
// =============================================================================

function generatePasswordResetEmailHtml(props: {
  memberName: string
  gymName: string
  gymLogoUrl: string | null
  resetUrl: string
}): string {
  const logoUrl = props.gymLogoUrl || `${process.env.NEXT_PUBLIC_APP_URL}/default-logo.svg`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña - ${props.gymName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Logo -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 40px 40px 24px 40px; text-align: center;">
                    <img src="${logoUrl}" alt="${props.gymName}" width="100" height="100" style="display: block; margin: 0 auto; max-width: 100px; height: auto; border-radius: 12px;" />
                  </td>
                </tr>
              </table>
              <!-- Title -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">Restablecer contraseña</h1>
                  </td>
                </tr>
              </table>
              <!-- Content -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px; text-align: center;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.6;">
                      Hola <strong>${props.memberName}</strong>,
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #52525b; line-height: 1.6;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${props.gymName}</strong>.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #84cc16;">
                          <a href="${props.resetUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            Crear nueva contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Link fallback -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center;">
                      Si el botón no funciona, copia y pega este enlace:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; text-align: center; word-break: break-all;">
                      <a href="${props.resetUrl}" style="color: #84cc16;">${props.resetUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #3f3f46;">${props.gymName}</p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Si no solicitaste esto, puedes ignorar este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function generatePasswordResetEmailText(props: {
  memberName: string
  gymName: string
  resetUrl: string
}): string {
  return `
Restablecer contraseña - ${props.gymName}

Hola ${props.memberName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en ${props.gymName}.

Para crear una nueva contraseña, visita el siguiente enlace:

${props.resetUrl}

Si no solicitaste esto, puedes ignorar este correo.

${props.gymName}
  `.trim()
}
