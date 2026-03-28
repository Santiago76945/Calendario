// functions/eventos-by-id.cjs

const {
    actualizarEventoDesdeDraft,
    eliminarEvento
} = require('./eventos/googleCalendarService.cjs')

function jsonHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Calendar-Id',
        'Access-Control-Allow-Methods': 'PUT,DELETE,OPTIONS'
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

function getIdFromPath(path) {
    const parts = String(path || '')
        .split('/')
        .filter(Boolean)

    return parts[parts.length - 1] || ''
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

    const id = getIdFromPath(event.path)

    if (!id) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Falta el ID del evento.' })
        }
    }

    if (event.httpMethod === 'PUT') {
        try {
            const ctx = getRequestContext(event)
            const payload = parseBody(event.body)

            if (!payload?.draft || typeof payload.draft !== 'object') {
                throw new Error('Falta el draft.')
            }

            if (!String(payload.icsContent || '').trim()) {
                throw new Error('Falta el contenido ICS.')
            }

            const actualizado = await actualizarEventoDesdeDraft({
                ...ctx,
                id,
                draft: payload.draft
            })

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(actualizado)
            }
        } catch (err) {
            console.error(err)
            return {
                statusCode: err.statusCode || 400,
                headers,
                body: JSON.stringify({
                    error: err.message || 'Error al actualizar evento'
                })
            }
        }
    }

    if (event.httpMethod === 'DELETE') {
        try {
            const ctx = getRequestContext(event)

            await eliminarEvento({
                ...ctx,
                id
            })

            return {
                statusCode: 204,
                headers,
                body: ''
            }
        } catch (err) {
            console.error(err)
            return {
                statusCode: err.statusCode || 500,
                headers,
                body: JSON.stringify({
                    error: err.message || 'Error al eliminar evento'
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