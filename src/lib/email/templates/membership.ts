/**
 * Email templates for membership expiration notifications
 */

export interface MembershipEmailData {
  memberName: string
  gymName: string
  expirationDate: string // Formatted date string (e.g., "26/01/2026")
  daysRemaining: number
  renewalUrl?: string
  contactEmail?: string
  contactPhone?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BRAND_COLOR = '#84cc16' // lime-500
const LOGO_URL = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.gymgo.io'}/icon-app.svg`

/**
 * Get subject line based on notification type
 */
export function getMembershipEmailSubject(
  type: 'expires_in_3_days' | 'expires_in_1_day' | 'expires_today' | 'expired',
  gymName: string
): string {
  const subjects = {
    expires_in_3_days: `Tu membresía en ${gymName} vence en 3 días`,
    expires_in_1_day: `⚠️ Tu membresía en ${gymName} vence mañana`,
    expires_today: `🔴 Tu membresía en ${gymName} vence HOY`,
    expired: `❌ Tu membresía en ${gymName} ha vencido`,
  }
  return subjects[type]
}

/**
 * Generate HTML email content for membership expiration
 */
export function getMembershipExpirationEmailHtml(
  type: 'expires_in_3_days' | 'expires_in_1_day' | 'expires_today' | 'expired',
  data: MembershipEmailData
): string {
  const { memberName, gymName, expirationDate, contactEmail, contactPhone } = data

  const messages = {
    expires_in_3_days: {
      title: 'Tu membresía está por vencer',
      subtitle: `Tu membresía vence el ${expirationDate} (en 3 días).`,
      message: 'Renueva ahora para seguir disfrutando de todos los beneficios y reservar clases sin interrupciones.',
      urgency: 'info',
    },
    expires_in_1_day: {
      title: '¡Tu membresía vence mañana!',
      subtitle: `Tu membresía vence el ${expirationDate} (mañana).`,
      message: 'Renueva hoy para evitar que se bloqueen tus reservas de clases.',
      urgency: 'warning',
    },
    expires_today: {
      title: '¡Tu membresía vence HOY!',
      subtitle: `Tu membresía vence hoy ${expirationDate}.`,
      message: 'Si no renuevas hoy, no podrás reservar clases a partir de mañana.',
      urgency: 'danger',
    },
    expired: {
      title: 'Tu membresía ha vencido',
      subtitle: `Tu membresía venció el ${expirationDate}.`,
      message: 'Renueva tu membresía para volver a reservar clases.',
      urgency: 'danger',
    },
  }

  const content = messages[type]

  const urgencyColors = {
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    danger: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  }

  const colors = urgencyColors[content.urgency as keyof typeof urgencyColors]

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${content.title} - ${gymName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">

          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

              <!-- Logo Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 40px 40px 24px 40px; text-align: center;">
                    <img
                      src="${LOGO_URL}"
                      alt="GymGo"
                      width="80"
                      height="80"
                      style="display: block; margin: 0 auto; max-width: 80px; height: auto;"
                    />
                  </td>
                </tr>
              </table>

              <!-- Gym Name -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 1px;">
                      ${gymName}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Alert Banner -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px;">
                    <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                      <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: ${colors.text};">
                        ${content.title}
                      </h1>
                      <p style="margin: 0; font-size: 15px; color: ${colors.text};">
                        ${content.subtitle}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 16px 40px;">
                    <p style="margin: 0; font-size: 18px; color: #3f3f46; line-height: 1.5;">
                      Hola <strong>${memberName}</strong>,
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px;">
                    <p style="margin: 0; font-size: 16px; color: #52525b; line-height: 1.6;">
                      ${content.message}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                          <a
                            href="mailto:${contactEmail || ''}"
                            style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #18181b; text-decoration: none; border-radius: 8px;"
                          >
                            Contactar para renovar
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              ${contactEmail || contactPhone ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; text-align: center;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #3f3f46;">
                        ¿Necesitas ayuda?
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                        Contacta directamente al gimnasio:
                        ${contactEmail ? `<br><a href="mailto:${contactEmail}" style="color: ${BRAND_COLOR};">${contactEmail}</a>` : ''}
                        ${contactPhone ? `<br><a href="tel:${contactPhone}" style="color: ${BRAND_COLOR};">${contactPhone}</a>` : ''}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #3f3f46;">
                      GymGo
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                      Enviado por ${gymName}
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #d4d4d8;">
                      &copy; ${new Date().getFullYear()} GymGo. Todos los derechos reservados.
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
}

/**
 * Generate plain text email content for membership expiration
 */
export function getMembershipExpirationEmailText(
  type: 'expires_in_3_days' | 'expires_in_1_day' | 'expires_today' | 'expired',
  data: MembershipEmailData
): string {
  const { memberName, gymName, expirationDate, contactEmail, contactPhone } = data

  const messages = {
    expires_in_3_days: `
Hola ${memberName},

Tu membresía en ${gymName} vence el ${expirationDate} (en 3 días).

Renueva ahora para seguir disfrutando de todos los beneficios y reservar clases sin interrupciones.
    `,
    expires_in_1_day: `
Hola ${memberName},

¡ATENCIÓN! Tu membresía en ${gymName} vence MAÑANA (${expirationDate}).

Renueva hoy para evitar que se bloqueen tus reservas de clases.
    `,
    expires_today: `
Hola ${memberName},

¡URGENTE! Tu membresía en ${gymName} vence HOY (${expirationDate}).

Si no renuevas hoy, no podrás reservar clases a partir de mañana.
    `,
    expired: `
Hola ${memberName},

Tu membresía en ${gymName} ha vencido (${expirationDate}).

Renueva tu membresía para volver a reservar clases.
    `,
  }

  let text = messages[type]

  if (contactEmail || contactPhone) {
    text += `
---
¿Necesitas ayuda? Contacta al gimnasio:
${contactEmail ? `Email: ${contactEmail}` : ''}
${contactPhone ? `Teléfono: ${contactPhone}` : ''}
`
  }

  text += `
---
Enviado por ${gymName} a través de GymGo.
  `

  return text.trim()
}
