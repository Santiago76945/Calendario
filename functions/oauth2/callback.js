// functions/oauth2/callback.js

const { google } = require('googleapis')

const {
    GCAL_CLIENT_ID,
    GCAL_CLIENT_SECRET,
    GCAL_REDIRECT_URI
} = process.env

exports.handler = async function (event, _context) {
    const code = event.queryStringParameters?.code

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing "code" parameter' })
        }
    }

    try {
        // Montamos cliente OAuth2 para intercambiar el code
        const oAuth2Client = new google.auth.OAuth2(
            GCAL_CLIENT_ID,
            GCAL_CLIENT_SECRET,
            GCAL_REDIRECT_URI
        )

        // Intercambiamos el código por tokens
        const { tokens } = await oAuth2Client.getToken(code)

        // tokens.refresh_token es el que necesitamos guardar
        // Respondemos con el refresh_token (y otros tokens, si quieres)
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refresh_token: tokens.refresh_token,
                access_token: tokens.access_token,
                expiry_date: tokens.expiry_date
            })
        }
    } catch (err) {
        console.error('Error exchanging code for tokens:', err)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error exchanging code for tokens' })
        }
    }
}
