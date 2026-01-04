// =============================================================================
// MEMBER INVITATION EMAIL TEMPLATE
// =============================================================================

export interface InvitationEmailProps {
  memberName: string
  gymName: string
  gymLogoUrl: string | null
  invitationUrl: string
  gymAddress?: string | null
}

/**
 * Generates HTML email for member invitation
 * Modern, responsive design with gym branding
 */
export function generateInvitationEmailHtml({
  memberName,
  gymName,
  gymLogoUrl,
  invitationUrl,
  gymAddress,
}: InvitationEmailProps): string {
  // Use default logo if none provided
  const logoUrl = gymLogoUrl || `${process.env.NEXT_PUBLIC_APP_URL}/default-logo.svg`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bienvenido a ${gymName}</title>
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
                      src="${logoUrl}"
                      alt="${gymName}"
                      width="120"
                      height="120"
                      style="display: block; margin: 0 auto; max-width: 120px; height: auto; border-radius: 12px;"
                    />
                  </td>
                </tr>
              </table>

              <!-- Title Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 16px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b; line-height: 1.3;">
                      Te han invitado a ${gymName}
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 18px; color: #3f3f46; line-height: 1.5;">
                      Hola <strong>${memberName}</strong>,
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                      Has sido invitado(a) a crear tu cuenta en el sistema de <strong>${gymName}</strong>.
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                      Desde aquí podrás ver tus rutinas, progreso, próximos entrenamientos y mucho más.
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
                        <td style="border-radius: 8px; background-color: #84cc16;">
                          <a
                            href="${invitationUrl}"
                            target="_blank"
                            style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;"
                          >
                            Confirmar cuenta y crear contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; text-align: center; word-break: break-all;">
                      <a href="${invitationUrl}" style="color: #84cc16; text-decoration: underline;">${invitationUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #3f3f46;">
                      ${gymName}
                    </p>
                    ${gymAddress ? `
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #71717a; line-height: 1.5;">
                      ${gymAddress}
                    </p>
                    ` : ''}
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                      Si no esperabas este correo, puedes ignorarlo de forma segura.
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
 * Generates plain text version of invitation email
 */
export function generateInvitationEmailText({
  memberName,
  gymName,
  invitationUrl,
}: InvitationEmailProps): string {
  return `
Te han invitado a ${gymName}

Hola ${memberName},

Has sido invitado(a) a crear tu cuenta en el sistema de ${gymName}.

Desde aquí podrás ver tus rutinas, progreso, próximos entrenamientos y mucho más.

Para confirmar tu cuenta y crear tu contraseña, visita el siguiente enlace:

${invitationUrl}

Si no esperabas este correo, puedes ignorarlo de forma segura.

${gymName}
  `.trim()
}
