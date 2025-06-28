// functions/eventos/googleCalendarService.js

const { google } = require('googleapis')

const {
    GCAL_CLIENT_ID,
    GCAL_CLIENT_SECRET,
    GCAL_REDIRECT_URI,
    GCAL_REFRESH_TOKEN,
    CALENDAR_ID = 'primary',
    TIMEZONE = 'America/Argentina/Cordoba'
} = process.env

// 1. Crear OAuth2Client
const oAuth2Client = new google.auth.OAuth2(
    GCAL_CLIENT_ID,
    GCAL_CLIENT_SECRET,
    GCAL_REDIRECT_URI
)

// 2. Si hay refresh token, lo seteamos
if (GCAL_REFRESH_TOKEN) {
    oAuth2Client.setCredentials({ refresh_token: GCAL_REFRESH_TOKEN })
}

// 3. Instanciar API Calendar
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

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

/** Obtiene hasta 50 eventos futuros */
async function obtenerEventos() {
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
        // Si no hay token o ha caducado, lanzamos OAuthRequiredError
        const reason =
            error?.errors?.[0]?.reason ||
            error?.response?.data?.error ||
            error.message
        if (reason === 'invalid_grant' || !GCAL_REFRESH_TOKEN) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

/** Crea un nuevo evento */
async function crearEvento(data) {
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
        if (reason === 'invalid_grant' || !GCAL_REFRESH_TOKEN) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

/** Actualiza un evento existente */
async function actualizarEvento(id, data) {
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
        if (reason === 'invalid_grant' || !GCAL_REFRESH_TOKEN) {
            throw new OAuthRequiredError('Authorization required')
        }
        throw error
    }
}

/** Elimina un evento por ID */
async function eliminarEvento(id) {
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
        if (reason === 'invalid_grant' || !GCAL_REFRESH_TOKEN) {
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
