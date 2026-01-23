// =============================================================================
// AUTH EMAIL TEMPLATES (Welcome/Confirm + Reset Password)
// =============================================================================

export interface WelcomeEmailProps {
  userName?: string
  confirmUrl: string
}

export interface ResetPasswordEmailProps {
  userName?: string
  resetUrl: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BRAND_COLOR = '#84cc16' // lime-500
const LOGO_URL = `${process.env.NEXT_PUBLIC_APP_URL}/icon-app.svg`

// =============================================================================
// WELCOME / CONFIRM EMAIL
// =============================================================================

export function generateWelcomeEmailHtml({ userName, confirmUrl }: WelcomeEmailProps): string {
  const greeting = userName ? `Hola ${userName},` : 'Hola,'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bienvenido a GymGo</title>
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

              <!-- Title Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 16px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b; line-height: 1.3;">
                      Bienvenido a GymGo
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 18px; color: #3f3f46; line-height: 1.5;">
                      ${greeting}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                      Gracias por registrarte en <strong>GymGo</strong>, la plataforma para gestionar tu gimnasio de forma inteligente.
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                      Para completar tu registro, confirma tu correo electronico haciendo clic en el boton de abajo.
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
                            href="${confirmUrl}"
                            target="_blank"
                            style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;"
                          >
                            Confirmar mi correo
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
                  <td style="padding: 0 40px 24px 40px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center;">
                      Si el boton no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; text-align: center; word-break: break-all;">
                      <a href="${confirmUrl}" style="color: ${BRAND_COLOR}; text-decoration: underline;">${confirmUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0; padding: 16px; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center; background-color: #fafafa; border-radius: 8px;">
                      Si no creaste una cuenta en GymGo, puedes ignorar este correo de forma segura.
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
                      GymGo
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                      La plataforma inteligente para tu gimnasio
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

export function generateWelcomeEmailText({ userName, confirmUrl }: WelcomeEmailProps): string {
  const greeting = userName ? `Hola ${userName},` : 'Hola,'

  return `
Bienvenido a GymGo

${greeting}

Gracias por registrarte en GymGo, la plataforma para gestionar tu gimnasio de forma inteligente.

Para completar tu registro, confirma tu correo electronico visitando el siguiente enlace:

${confirmUrl}

Si no creaste una cuenta en GymGo, puedes ignorar este correo de forma segura.

---
GymGo - La plataforma inteligente para tu gimnasio
  `.trim()
}

// =============================================================================
// RESET PASSWORD EMAIL
// =============================================================================

export function generateResetPasswordEmailHtml({ userName, resetUrl }: ResetPasswordEmailProps): string {
  const greeting = userName ? `Hola ${userName},` : 'Hola,'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Restablecer contrasena - GymGo</title>
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

              <!-- Title Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 16px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b; line-height: 1.3;">
                      Restablecer contrasena
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 18px; color: #3f3f46; line-height: 1.5;">
                      ${greeting}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 32px 40px;">
                    <p style="margin: 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                      Recibimos una solicitud para restablecer la contrasena de tu cuenta en <strong>GymGo</strong>. Haz clic en el boton de abajo para crear una nueva contrasena.
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
                            href="${resetUrl}"
                            target="_blank"
                            style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;"
                          >
                            Crear nueva contrasena
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
                  <td style="padding: 0 40px 24px 40px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center;">
                      Si el boton no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; text-align: center; word-break: break-all;">
                      <a href="${resetUrl}" style="color: ${BRAND_COLOR}; text-decoration: underline;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Expiration Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 24px 40px;">
                    <p style="margin: 0; font-size: 13px; color: #f59e0b; line-height: 1.5; text-align: center;">
                      Este enlace expirara en 1 hora por seguridad.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0; padding: 16px; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center; background-color: #fafafa; border-radius: 8px;">
                      Si no solicitaste restablecer tu contrasena, puedes ignorar este correo. Tu cuenta permanecera segura.
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
                      GymGo
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                      La plataforma inteligente para tu gimnasio
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

export function generateResetPasswordEmailText({ userName, resetUrl }: ResetPasswordEmailProps): string {
  const greeting = userName ? `Hola ${userName},` : 'Hola,'

  return `
Restablecer contrasena - GymGo

${greeting}

Recibimos una solicitud para restablecer la contrasena de tu cuenta en GymGo.

Para crear una nueva contrasena, visita el siguiente enlace:

${resetUrl}

IMPORTANTE: Este enlace expirara en 1 hora por seguridad.

Si no solicitaste restablecer tu contrasena, puedes ignorar este correo. Tu cuenta permanecera segura.

---
GymGo - La plataforma inteligente para tu gimnasio
  `.trim()
}
