// functions/oauth2-initiateAuth.cjs

const { google } = require('googleapis')
const { GCAL_CLIENT_ID, SITE_URL } = process.env

const host = process.env.URL || SITE_URL || 'http://localhost:8888'
const redirectUri = `${host}/.netlify/functions/oauth2-callback`

exports.handler = async function (_event) {
    const oAuth2Client = new google.auth.OAuth2(
        GCAL_CLIENT_ID,
        '',
        redirectUri
    )
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent select_account',
        login_hint: 'estudiovgh@yahoo.com',
        scope: ['https://www.googleapis.com/auth/calendar']
    })
    return {
        statusCode: 302,
        headers: { Location: authUrl },
        body: ''
    }
}
