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

/** Obtiene hasta 50 eventos futuros */
async function obtenerEventos() {
    const res = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
        fields: 'items(id,summary,location,start,end,colorId,reminders)'
    })
    return res.data.items
}

/** Crea un nuevo evento */
async function crearEvento(data) {
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
}

/** Actualiza un evento existente */
async function actualizarEvento(id, data) {
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
}

/** Elimina un evento por ID */
async function eliminarEvento(id) {
    await calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: id
    })
}

module.exports = {
    obtenerEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento
}
