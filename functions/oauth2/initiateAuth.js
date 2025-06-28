// functions/oauth2/initiateAuth.js

const { google } = require('googleapis')

const {
    GCAL_CLIENT_ID,
    GCAL_REDIRECT_URI
} = process.env

exports.handler = async function (_event, _context) {
    // Los scopes que necesitamos para Calendar (lectura y escritura)
    const scopes = ['https://www.googleapis.com/auth/calendar']

    // Creamos un cliente OAuth2 solo para generar la URL de autorización
    const oAuth2Client = new google.auth.OAuth2(
        GCAL_CLIENT_ID,
    /* clientSecret no es necesario aquí */ '',
        GCAL_REDIRECT_URI
    )

    // Generamos la URL con access_type offline para obtener refresh_token
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes
    })

    // Redirigimos al usuario a Google para que autorice la app
    return {
        statusCode: 302,
        headers: {
            Location: authUrl
        },
        body: ''
    }
}
