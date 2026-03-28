// functions/ics/export.cjs

const { obtenerTodosLosEventos } = require('../eventos/googleCalendarService.cjs')

function icsHeaders() {
    return {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendario.ics"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization,X-Calendar-Id',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
}

function extractAccessToken(event) {
    const authorization =
        event?.headers?.authorization ||
        event?.headers?.Authorization ||
        ''

    const match = String(authorization).match(/^Bearer\s+(.+)$/i)
    return match ? match[1].trim() : ''
}

function extractCalendarId(event) {
    return String(
        event?.headers?.['x-calendar-id'] ||
            event?.headers?.['X-Calendar-Id'] ||
            ''
    ).trim()
}

function getRequestContext(event) {
    const accessToken = extractAccessToken(event)
    const calendarId = extractCalendarId(event)

    if (!accessToken) {
        const error = new Error('Falta Authorization Bearer token.')
        error.statusCode = 401
        throw error
    }

    if (!calendarId) {
        const error = new Error('Falta el header X-Calendar-Id.')
        error.statusCode = 400
        throw error
    }

    return { accessToken, calendarId }
}

function pad(value) {
    return String(value).padStart(2, '0')
}

function toLocalIcsDateTime(value) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Fecha inválida: ${value}`)
    }

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join('') +
        'T' +
        [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('')
}

function toUtcStamp(date = new Date()) {
    return [
        date.getUTCFullYear(),
        pad(date.getUTCMonth() + 1),
        pad(date.getUTCDate())
    ].join('') +
        'T' +
        [pad(date.getUTCHours()), pad(date.getUTCMinutes()), pad(date.getUTCSeconds())].join('') +
        'Z'
}

function escapeIcsText(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
}

function eventToIcsBlock(evento) {
    const start = evento?.start?.dateTime || evento?.start?.date || ''
    const end = evento?.end?.dateTime || evento?.end?.date || ''
    const timeZone =
        evento?.timeZone ||
        evento?.start?.timeZone ||
        evento?.end?.timeZone ||
        'Europe/Dublin'

    return [
        'BEGIN:VEVENT',
        `UID:${escapeIcsText(evento.uid || `${evento.id}@calendar.local`)}`,
        `DTSTAMP:${toUtcStamp()}`,
        `DTSTART;TZID=${escapeIcsText(timeZone)}:${toLocalIcsDateTime(start)}`,
        `DTEND;TZID=${escapeIcsText(timeZone)}:${toLocalIcsDateTime(end)}`,
        `SUMMARY:${escapeIcsText(evento.summary || 'Sin título')}`,
        evento.location ? `LOCATION:${escapeIcsText(evento.location)}` : '',
        evento.description ? `DESCRIPTION:${escapeIcsText(evento.description)}` : '',
        'END:VEVENT'
    ]
        .filter(Boolean)
        .join('\r\n')
}

exports.handler = async function (event) {
    const headers = icsHeaders()

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        }
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Método no permitido' })
        }
    }

    try {
        const ctx = getRequestContext(event)
        const eventos = await obtenerTodosLosEventos(ctx)

        const body = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Santiago Haspert Piaggio//Calendar ICS//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            ...eventos.map(eventToIcsBlock),
            'END:VCALENDAR',
            ''
        ].join('\r\n')

        return {
            statusCode: 200,
            headers,
            body
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: err.statusCode || 500,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: err.message || 'No se pudo exportar el calendario.'
            })
        }
    }
}