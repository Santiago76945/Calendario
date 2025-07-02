// functions/eventos/googleCalendarService.js

const { google } = require('googleapis')

const {
    GCAL_CLIENT_ID,
    GCAL_CLIENT_SECRET,
    GCAL_REDIRECT_URI,
    CALENDAR_ID = 'primary',
    TIMEZONE = 'America/Argentina/Cordoba'
} = process.env

/**
 * Error custom para indicar que se requiere nueva autorización OAuth
 */
class OAuthRequiredError extends Error {
    constructor(message) {
        super(message)
        this.name = 'OAuthRequiredError'
        this.statusCode = 401
    }
}

/**
 * Crea un OAuth2Client configurado con el refresh token dinámico
 * @param {string} refreshToken
 */
function getOAuthClient(refreshToken) {
    const oAuth2Client = new google.auth.OAuth2(
        GCAL_CLIENT_ID,
        GCAL_CLIENT_SECRET,
        GCAL_REDIRECT_URI
    )
    if (refreshToken) {
        oAuth2Client.setCredentials({ refresh_token: refreshToken })
    }
    return oAuth2Client
}

/**
 * Instancia la API de Calendar para un refresh token dado
 * @param {string} refreshToken
 */
function getCalendar(refreshToken) {
    const auth = getOAuthClient(refreshToken)
    return google.calendar({ version: 'v3', auth })
}

/** Obtiene hasta 50 eventos futuros */
async function obtenerEventos(refreshToken) {
    const calendar = getCalendar(refreshToken)
    try {
        const res = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
            fields: 'items(id,summary,location,start,end,colorId,reminders)'
        })
        return res.data.items
    } catch (error) {
        const reason =
            error?.errors?.[0]?.reason ||
            error?.response?.data?.error ||
            error.message
        if (reason === 'invalid_grant' || !refreshToken) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

/** Crea un nuevo evento */
async function crearEvento(refreshToken, data) {
    const calendar = getCalendar(refreshToken)
    try {
        const recurso = {
            summary: data.summary,
            description: data.description,
            location: data.location,
            start: {
                dateTime: data.start.dateTime,
                timeZone: data.start.timeZone || TIMEZONE
            },
            end: {
                dateTime: data.end.dateTime,
                timeZone: data.end.timeZone || TIMEZONE
            },
            reminders: data.reminders,
            colorId: data.colorId
        }
        const res = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: recurso
        })
        return res.data
    } catch (error) {
        const reason =
            error?.errors?.[0]?.reason ||
            error?.response?.data?.error ||
            error.message
        if (reason === 'invalid_grant' || !refreshToken) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

/** Actualiza un evento existente */
async function actualizarEvento(refreshToken, id, data) {
    const calendar = getCalendar(refreshToken)
    try {
        const recurso = {
            summary: data.summary,
            description: data.description,
            location: data.location,
            start: {
                dateTime: data.start.dateTime,
                timeZone: data.start.timeZone || TIMEZONE
            },
            end: {
                dateTime: data.end.dateTime,
                timeZone: data.end.timeZone || TIMEZONE
            },
            reminders: data.reminders,
            colorId: data.colorId
        }
        const res = await calendar.events.update({
            calendarId: CALENDAR_ID,
            eventId: id,
            resource: recurso
        })
        return res.data
    } catch (error) {
        const reason =
            error?.errors?.[0]?.reason ||
            error?.response?.data?.error ||
            error.message
        if (reason === 'invalid_grant' || !refreshToken) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

/** Elimina un evento por ID */
async function eliminarEvento(refreshToken, id) {
    const calendar = getCalendar(refreshToken)
    try {
        await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: id
        })
    } catch (error) {
        const reason =
            error?.errors?.[0]?.reason ||
            error?.response?.data?.error ||
            error.message
        if (reason === 'invalid_grant' || !refreshToken) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

module.exports = {
    obtenerEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    OAuthRequiredError
}
