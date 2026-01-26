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
      message: `Tu membresía vence el <strong>${expirationDate}</strong> (en 3 días).`,
      cta: 'Renueva ahora para seguir disfrutando de todos los beneficios y reservar clases sin interrupciones.',
      urgency: 'info',
    },
    expires_in_1_day: {
      title: '¡Tu membresía vence mañana!',
      message: `Tu membresía vence el <strong>${expirationDate}</strong> (mañana).`,
      cta: 'Renueva hoy para evitar que se bloqueen tus reservas de clases.',
      urgency: 'warning',
    },
    expires_today: {
      title: '¡Tu membresía vence HOY!',
      message: `Tu membresía vence <strong>hoy ${expirationDate}</strong>.`,
      cta: 'Si no renuevas hoy, no podrás reservar clases a partir de mañana.',
      urgency: 'danger',
    },
    expired: {
      title: 'Tu membresía ha vencido',
      message: `Tu membresía venció el <strong>${expirationDate}</strong>.`,
      cta: 'Renueva tu membresía para volver a reservar clases.',
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
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background-color: #18181b; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #84cc16; font-size: 24px; font-weight: 700;">${gymName}</h1>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px; margin-top: 24px; border-radius: 0 8px 8px 0;">
                <h2 style="margin: 0 0 8px; color: ${colors.text}; font-size: 18px; font-weight: 600;">${content.title}</h2>
                <p style="margin: 0; color: ${colors.text}; font-size: 14px;">${content.message}</p>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 32px 16px;">
              <p style="margin: 0; color: #3f3f46; font-size: 16px;">Hola <strong>${memberName}</strong>,</p>
            </td>
          </tr>

          <!-- CTA Message -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; color: #52525b; font-size: 15px; line-height: 1.6;">
                ${content.cta}
              </p>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; padding: 14px 32px; background-color: #84cc16; color: #18181b; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Contactar para renovar
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #3f3f46; font-size: 14px; font-weight: 600;">¿Necesitas ayuda?</p>
                <p style="margin: 0; color: #71717a; font-size: 14px;">
                  Contacta directamente al gimnasio:
                  ${contactEmail ? `<br>📧 ${contactEmail}` : ''}
                  ${contactPhone ? `<br>📱 ${contactPhone}` : ''}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f4f4f5; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                Este correo fue enviado automáticamente por ${gymName} a través de GymGo.
              </p>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} GymGo - Gestión de gimnasios
              </p>
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

  text += `
---
¿Necesitas ayuda? Contacta al gimnasio:
${contactEmail ? `Email: ${contactEmail}` : ''}
${contactPhone ? `Teléfono: ${contactPhone}` : ''}

---
Este mensaje fue enviado automáticamente por ${gymName} a través de GymGo.
  `

  return text.trim()
}
