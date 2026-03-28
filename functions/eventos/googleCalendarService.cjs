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

function ensureValidTimeZone(timeZone) {
    const safeTimeZone = String(timeZone || '').trim() || TIMEZONE

    try {
        new Intl.DateTimeFormat('en-US', { timeZone: safeTimeZone }).format(
            new Date()
        )
        return safeTimeZone
    } catch (error) {
        throw new Error(`Zona horaria inválida: ${safeTimeZone}`)
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

function pad(value) {
    return String(value).padStart(2, '0')
}

function parseLocalDateTime(localDateTime) {
    const match = String(localDateTime || '')
        .trim()
        .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)

    if (!match) {
        throw new Error(`Fecha local inválida: ${localDateTime}`)
    }

    const [, year, month, day, hour, minute] = match

    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute)
    }
}

function getDatePartsInTimeZone(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    })

    const parts = formatter.formatToParts(date)
    const map = {}

    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value
        }
    }

    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second)
    }
}

function getOffsetMinutesForInstant(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset'
    })

    const timeZonePart = formatter
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')

    const raw = String(timeZonePart?.value || 'GMT').trim()

    if (raw === 'GMT' || raw === 'UTC') {
        return 0
    }

    const match = raw.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/i)

    if (!match) {
        throw new Error(`No se pudo interpretar el offset para ${timeZone}: ${raw}`)
    }

    const [, sign, hours, minutes = '00'] = match
    const total = Number(hours) * 60 + Number(minutes)

    return sign === '-' ? -total : total
}

function getUtcDateFromLocalDateTime(localDateTime, timeZone) {
    const safeTimeZone = ensureValidTimeZone(timeZone)
    const parts = parseLocalDateTime(localDateTime)

    let utcMillis = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        0,
        0
    )

    for (let index = 0; index < 4; index += 1) {
        const guessDate = new Date(utcMillis)
        const zonedParts = getDatePartsInTimeZone(guessDate, safeTimeZone)

        const desiredUtcMinutes = Math.round(
            Date.UTC(
                parts.year,
                parts.month - 1,
                parts.day,
                parts.hour,
                parts.minute,
                0,
                0
            ) / 60000
        )

        const actualUtcMinutes = Math.round(
            Date.UTC(
                zonedParts.year,
                zonedParts.month - 1,
                zonedParts.day,
                zonedParts.hour,
                zonedParts.minute,
                zonedParts.second || 0,
                0
            ) / 60000
        )

        const diffMinutes = desiredUtcMinutes - actualUtcMinutes

        if (diffMinutes === 0) {
            break
        }

        utcMillis += diffMinutes * 60000
    }

    return new Date(utcMillis)
}

function toGoogleDateTime(localDateTime, timeZone) {
    const safeTimeZone = ensureValidTimeZone(timeZone)
    const instant = getUtcDateFromLocalDateTime(localDateTime, safeTimeZone)
    const offsetMinutes = getOffsetMinutesForInstant(instant, safeTimeZone)
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const absolute = Math.abs(offsetMinutes)
    const offsetHours = pad(Math.floor(absolute / 60))
    const offsetRemainingMinutes = pad(absolute % 60)

    const { year, month, day, hour, minute } = parseLocalDateTime(localDateTime)

    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(
        minute
    )}:00${sign}${offsetHours}:${offsetRemainingMinutes}`
}

function convertAbsoluteDateTimeToLocalDateTime(value, timeZone) {
    const safeTimeZone = ensureValidTimeZone(timeZone)
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const parts = getDatePartsInTimeZone(date, safeTimeZone)

    return `${String(parts.year).padStart(4, '0')}-${pad(parts.month)}-${pad(
        parts.day
    )}T${pad(parts.hour)}:${pad(parts.minute)}`
}

function getDurationMinutes(startDateTime, endDateTime) {
    const start = parseLocalDateTime(startDateTime)
    const end = parseLocalDateTime(endDateTime)

    const startUtc = Date.UTC(
        start.year,
        start.month - 1,
        start.day,
        start.hour,
        start.minute,
        0,
        0
    )

    const endUtc = Date.UTC(
        end.year,
        end.month - 1,
        end.day,
        end.hour,
        end.minute,
        0,
        0
    )

    const diff = Math.round((endUtc - startUtc) / 60000)
    return diff > 0 ? diff : 0
}

function normalizeDraftForGoogle(draft) {
    if (!draft || typeof draft !== 'object') {
        throw new Error('Draft inválido.')
    }

    const summary = String(draft.summary || '').trim()
    const description = String(draft.description || '').trim()
    const location = String(draft.location || '').trim()
    const timeZone = ensureValidTimeZone(draft.timeZone || TIMEZONE)
    const startDateTime = String(draft.startDateTime || '').trim()
    const endDateTime = String(draft.endDateTime || '').trim()
    const status = String(draft.status || 'CONFIRMED').trim()

    if (!summary) {
        throw new Error('El draft debe tener summary.')
    }

    if (!startDateTime) {
        throw new Error('El draft debe tener startDateTime.')
    }

    if (!endDateTime) {
        throw new Error('El draft debe tener endDateTime.')
    }

    const durationMinutes = getDurationMinutes(startDateTime, endDateTime)

    if (durationMinutes <= 0) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio.')
    }

    return {
        summary,
        description,
        location,
        timeZone,
        startDateTime,
        endDateTime,
        durationMinutes,
        status
    }
}

function mapGoogleEventToAppEvent(item) {
    const eventTimeZone = item.start?.timeZone || item.end?.timeZone || TIMEZONE

    return {
        id: item.id,
        summary: item.summary || '',
        description: item.description || '',
        location: item.location || '',
        start: item.start || {},
        end: item.end || {},
        timeZone: eventTimeZone,
        startDateTime: item.start?.dateTime
            ? convertAbsoluteDateTimeToLocalDateTime(item.start.dateTime, eventTimeZone)
            : '',
        endDateTime: item.end?.dateTime
            ? convertAbsoluteDateTimeToLocalDateTime(item.end.dateTime, eventTimeZone)
            : '',
        status: item.status || 'confirmed',
        uid: item.iCalUID || '',
        categories: [],
        notes: '',
        productId: '-//Santiago Haspert Piaggio//Calendar ICS//EN'
    }
}

function buildGoogleResourceFromDraft(draft) {
    const normalized = normalizeDraftForGoogle(draft)

    return {
        summary: normalized.summary,
        description: normalized.description,
        location: normalized.location,
        status:
            normalized.status.toUpperCase() === 'CANCELLED'
                ? 'cancelled'
                : 'confirmed',
        start: {
            dateTime: toGoogleDateTime(
                normalized.startDateTime,
                normalized.timeZone
            ),
            timeZone: normalized.timeZone
        },
        end: {
            dateTime: toGoogleDateTime(normalized.endDateTime, normalized.timeZone),
            timeZone: normalized.timeZone
        }
    }
}

function normalizeGoogleApiError(err) {
    const status = err?.code || err?.response?.status || 500

    const message =
        err?.errors?.[0]?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Error desconocido con Google Calendar.'

    const wrapped = new Error(message)
    wrapped.statusCode = status

    return wrapped
}

function normalizePageSize(pageSize) {
    const parsed = Number(pageSize)

    if (!Number.isFinite(parsed)) {
        return 10
    }

    return Math.max(1, Math.min(25, Math.trunc(parsed)))
}

async function obtenerEventos({
    accessToken,
    calendarId,
    pageToken = '',
    pageSize = 10
}) {
    try {
        ensureAccessToken(accessToken)
        ensureCalendarId(calendarId)

        const calendar = createAuthorizedCalendarClient(accessToken)
        const safePageToken = String(pageToken || '').trim()
        const safePageSize = normalizePageSize(pageSize)

        const res = await calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(),
            maxResults: safePageSize,
            pageToken: safePageToken || undefined,
            singleEvents: true,
            orderBy: 'startTime',
            fields:
                'items(id,summary,description,location,status,iCalUID,start,end),nextPageToken'
        })

        return {
            items: (res.data.items || []).map(mapGoogleEventToAppEvent),
            nextPageToken: String(res.data.nextPageToken || ''),
            pageSize: safePageSize
        }
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

async function obtenerTodosLosEventos({
    accessToken,
    calendarId,
    maxResults = 250
}) {
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