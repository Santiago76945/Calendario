// functions/eventos/index.cjs

const {
    obtenerEventos,
    crearEventoDesdeDraft
} = require('./googleCalendarService.cjs')

function jsonHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Calendar-Id',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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

function validateDraftPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Payload inválido.')
    }

    if (!payload.draft || typeof payload.draft !== 'object') {
        throw new Error('Falta el draft.')
    }

    if (!String(payload.icsContent || '').trim()) {
        throw new Error('Falta el contenido ICS.')
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

    if (event.httpMethod === 'GET') {
        try {
            const ctx = getRequestContext(event)
            const items = await obtenerEventos(ctx)

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(items)
            }
        } catch (err) {
            console.error(err)
            return {
                statusCode: err.statusCode || 500,
                headers,
                body: JSON.stringify({
                    error: err.message || 'Error al listar eventos'
                })
            }
        }
    }

    if (event.httpMethod === 'POST') {
        try {
            const ctx = getRequestContext(event)
            const payload = parseBody(event.body)
            validateDraftPayload(payload)

            const nuevo = await crearEventoDesdeDraft({
                ...ctx,
                draft: payload.draft
            })

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(nuevo)
            }
        } catch (err) {
            console.error(err)
            return {
                statusCode: err.statusCode || 400,
                headers,
                body: JSON.stringify({
                    error: err.message || 'Error al crear evento'
                })
            }
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' })
    }
}