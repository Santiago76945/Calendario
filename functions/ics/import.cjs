// functions/ics/import.cjs

const { crearEventoDesdeDraft } = require('../eventos/googleCalendarService.cjs')
const { parseIcsToDraft } = require('../lib/ics/parseIcsToDraft.cjs')

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

        const draft = parseIcsToDraft(icsContent, {
            fallbackTimeZone: 'Europe/Dublin'
        })

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