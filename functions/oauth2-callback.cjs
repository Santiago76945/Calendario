// functions/oauth2-callback.cjs

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const {
    GCAL_CLIENT_ID,
    GCAL_CLIENT_SECRET,
    GCAL_REDIRECT_URI
} = process.env

exports.handler = async function (event) {
    const code = event.queryStringParameters?.code
    if (!code) {
        return { statusCode: 400, body: 'Missing "code" parameter' }
    }

    const oAuth2Client = new google.auth.OAuth2(
        GCAL_CLIENT_ID,
        GCAL_CLIENT_SECRET,
        GCAL_REDIRECT_URI
    )

    try {
        const { tokens } = await oAuth2Client.getToken(code)
        const refreshToken = tokens.refresh_token

        // Devolvemos un HTML/JS que guarda el token en localStorage
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8"/>
          <title>Autorización completada</title>
          <script>
            localStorage.setItem('gcal_refresh_token', '${refreshToken}')
            setTimeout(() => { window.location.href = '/calendario' }, 500)
          </script>
        </head>
        <body style="font-family:sans-serif; text-align:center; margin-top:2rem">
          <h1>✔ Autorización exitosa</h1>
          <p>Redirigiendo a tu calendario…</p>
          <p><small>Si no redirige, <a href="/calendario">haz clic aquí</a>.</small></p>
        </body>
        </html>
      `
        }
    } catch (err) {
        console.error('Error exchanging code:', err)
        return { statusCode: 500, body: 'Error al intercambiar el código por tokens' }
    }
}
