// functions/oauth2callback.js

const { google } = require('googleapis')

exports.handler = async function (event, context) {
    // Extraemos el parámetro ?code=… de la URL
    const code = event.queryStringParameters && event.queryStringParameters.code
    if (!code) {
        return {
            statusCode: 400,
            body: 'Falta el parámetro "code"'
        }
    }

    // Configuramos el cliente OAuth2 con las credenciales de entorno
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GCAL_CLIENT_ID,
        process.env.GCAL_CLIENT_SECRET,
        process.env.GCAL_REDIRECT_URI
    )

    try {
        // Intercambiamos el código por tokens de acceso y refresh
        const { tokens } = await oAuth2Client.getToken(code)

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokens)
        }
    } catch (err) {
        console.error('Error en OAuth callback:', err)
        return {
            statusCode: 500,
            body: 'Error al intercambiar el código por tokens'
        }
    }
}
