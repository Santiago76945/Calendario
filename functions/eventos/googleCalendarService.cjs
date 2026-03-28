// functions/eventos/googleCalendarService.cjs

const { google } = require('googleapis')

const { TIMEZONE = 'Europe/Dublin' } = process.env

function ensureAccessToken(accessToken) {
    if (!String(accessToken || '').trim()) {
        throw new Error('Falta el access token de Google.')
    }
}

function ensureCalendarId(calendarId) {
    if (!String(calendarId || '').trim()) {
        throw new Error('Falta el calendarId.')
    }
}

function createAuthorizedCalendarClient(accessToken) {
    ensureAccessToken(accessToken)

    const auth = new google.auth.OAuth2()
    auth.setCredentials({
        access_token: accessToken
    })

    return google.calendar({
        version: 'v3',
        auth
    })
}

function mapGoogleEventToAppEvent(item) {
    return {
        id: item.id,
        summary: item.summary || '',
        description: item.description || '',
        location: item.location || '',
        start: item.start || {},
        end: item.end || {},
        timeZone:
            item.start?.timeZone ||
            item.end?.timeZone ||
            TIMEZONE,
        status: item.status || 'confirmed',
        uid: item.iCalUID || '',
        categories: [],
        notes: '',
        productId: '-//Santiago Haspert Piaggio//Calendar ICS//EN'
    }
}

function buildGoogleResourceFromDraft(draft) {
    return {
        summary: draft.summary,
        description: draft.description || '',
        location: draft.location || '',
        status:
            String(draft.status || '').toUpperCase() === 'CANCELLED'
                ? 'cancelled'
                : 'confirmed',
        start: {
            dateTime: draft.startDateTime,
            timeZone: draft.timeZone || TIMEZONE
        },
        end: {
            dateTime: draft.endDateTime,
            timeZone: draft.timeZone || TIMEZONE
        }
    }
}

function normalizeGoogleApiError(err) {
    const status =
        err?.code ||
        err?.response?.status ||
        500

    const message =
        err?.errors?.[0]?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Error desconocido con Google Calendar.'

    const wrapped = new Error(message)
    wrapped.statusCode = status

    return wrapped
}

async function obtenerEventos({ accessToken, calendarId }) {
    try {
        ensureAccessToken(accessToken)
        ensureCalendarId(calendarId)

        const calendar = createAuthorizedCalendarClient(accessToken)

        const res = await calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
            fields:
                'items(id,summary,description,location,status,iCalUID,start,end),nextPageToken'
        })

        return (res.data.items || []).map(mapGoogleEventToAppEvent)
    } catch (err) {
        throw normalizeGoogleApiError(err)
    }
}

async function crearEventoDesdeDraft({ accessToken, calendarId, draft }) {
    try {
        ensureAccessToken(accessToken)
        ensureCalendarId(calendarId)

        const calendar = createAuthorizedCalendarClient(accessToken)
        const resource = buildGoogleResourceFromDraft(draft)

        const res = await calendar.events.insert({
            calendarId,
            resource
        })

        return mapGoogleEventToAppEvent(res.data)
    } catch (err) {
        throw normalizeGoogleApiError(err)
    }
}

async function actualizarEventoDesdeDraft({ accessToken, calendarId, id, draft }) {
    try {
        ensureAccessToken(accessToken)
        ensureCalendarId(calendarId)

        const calendar = createAuthorizedCalendarClient(accessToken)
        const resource = buildGoogleResourceFromDraft(draft)

        const res = await calendar.events.update({
            calendarId,
            eventId: id,
            resource
        })

        return mapGoogleEventToAppEvent(res.data)
    } catch (err) {
        throw normalizeGoogleApiError(err)
    }
}

async function eliminarEvento({ accessToken, calendarId, id }) {
    try {
        ensureAccessToken(accessToken)
        ensureCalendarId(calendarId)

        const calendar = createAuthorizedCalendarClient(accessToken)

        await calendar.events.delete({
            calendarId,
            eventId: id
        })
    } catch (err) {
        throw normalizeGoogleApiError(err)
    }
}

async function obtenerTodosLosEventos({ accessToken, calendarId, maxResults = 250 }) {
    try {
        ensureAccessToken(accessToken)
        ensureCalendarId(calendarId)

        const calendar = createAuthorizedCalendarClient(accessToken)

        const res = await calendar.events.list({
            calendarId,
            timeMin: new Date('2000-01-01T00:00:00.000Z').toISOString(),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
            fields:
                'items(id,summary,description,location,status,iCalUID,start,end),nextPageToken'
        })

        return (res.data.items || []).map(mapGoogleEventToAppEvent)
    } catch (err) {
        throw normalizeGoogleApiError(err)
    }
}

module.exports = {
    obtenerEventos,
    crearEventoDesdeDraft,
    actualizarEventoDesdeDraft,
    eliminarEvento,
    obtenerTodosLosEventos
}