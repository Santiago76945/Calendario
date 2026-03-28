// functions/ics/import.cjs

const { crearEventoDesdeDraft } = require('../eventos/googleCalendarService.cjs')

function jsonHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Calendar-Id',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
}

function parseBody(body) {
    if (!body) return {}

    try {
        return JSON.parse(body)
    } catch (error) {
        throw new Error('El body JSON no es válido.')
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

function getMatch(content, regex) {
    const match = content.match(regex)
    return match ? match[1].trim() : ''
}

function unescapeIcsText(value) {
    return String(value || '')
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
}

function parseIcsToDraft(icsContent) {
    const content = String(icsContent || '')

    if (!content.includes('BEGIN:VCALENDAR') || !content.includes('BEGIN:VEVENT')) {
        throw new Error('El contenido ICS no contiene un VEVENT válido.')
    }

    const summary = unescapeIcsText(getMatch(content, /SUMMARY:(.+)/))
    const location = unescapeIcsText(getMatch(content, /LOCATION:(.+)/))
    const description = unescapeIcsText(getMatch(content, /DESCRIPTION:(.+)/))
    const uid = unescapeIcsText(getMatch(content, /UID:(.+)/))
    const status = unescapeIcsText(getMatch(content, /STATUS:(.+)/)) || 'CONFIRMED'

    const dtStartMatch = content.match(/DTSTART(?:;TZID=([^:]+))?:(.+)/)
    const dtEndMatch = content.match(/DTEND(?:;TZID=([^:]+))?:(.+)/)

    if (!dtStartMatch || !dtEndMatch) {
        throw new Error('El contenido ICS debe incluir DTSTART y DTEND.')
    }

    const timeZone =
        (dtStartMatch[1] || dtEndMatch[1] || 'Europe/Dublin').trim()

    const startDateTime = normalizeIcsDateTime(dtStartMatch[2])
    const endDateTime = normalizeIcsDateTime(dtEndMatch[2])

    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    const durationMinutes = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 60000)
    )

    return {
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        durationMinutes,
        timeZone,
        uid,
        status,
        productId: '-//Santiago Haspert Piaggio//Calendar ICS//EN',
        categories: [],
        notes: ''
    }
}

function normalizeIcsDateTime(value) {
    const clean = String(value || '').trim().replace(/Z$/, '')

    const match = clean.match(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/
    )

    if (!match) {
        throw new Error(`No se pudo interpretar la fecha ICS: ${value}`)
    }

    const [, year, month, day, hours, minutes] = match
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

exports.handler = async function (event) {
    const headers = jsonHeaders()

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        }
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        }
    }

    try {
        const ctx = getRequestContext(event)
        const body = parseBody(event.body)
        const icsContent = String(body?.icsContent || '').trim()

        if (!icsContent) {
            throw new Error('Debes enviar contenido ICS.')
        }

        const draft = parseIcsToDraft(icsContent)
        const created = await crearEventoDesdeDraft({
            ...ctx,
            draft
        })

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ok: true,
                message: 'Archivo ICS importado correctamente.',
                event: created
            })
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: err.statusCode || 400,
            headers,
            body: JSON.stringify({
                error: err.message || 'No se pudo importar el archivo ICS.'
            })
        }
    }
}