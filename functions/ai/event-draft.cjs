// functions/ai/event-draft.cjs

function jsonHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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

function extractConversationText(conversation) {
    if (!Array.isArray(conversation)) return ''

    return conversation
        .map((item) => `${item?.role || 'user'}: ${item?.content || ''}`)
        .join('\n')
}

function inferLocation(text) {
    const lower = text.toLowerCase()

    if (lower.includes('steam')) return 'Online (Steam)'
    if (lower.includes('zoom')) return 'Online (Zoom)'
    if (lower.includes('google meet')) return 'Online (Google Meet)'
    if (lower.includes('online')) return 'Online'
    if (lower.includes('virtual')) return 'Virtual'

    return ''
}

function inferDurationMinutes(text) {
    const minutesMatch = text.match(/(\d+)\s*(min|mins|minutos|minutes)\b/i)
    if (minutesMatch) {
        return Number(minutesMatch[1])
    }

    const hoursMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(hora|horas|hour|hours|h)\b/i)
    if (hoursMatch) {
        const value = Number(String(hoursMatch[1]).replace(',', '.'))
        if (Number.isFinite(value)) {
            return Math.round(value * 60)
        }
    }

    return null
}

function inferDateTime(text) {
    const isoMatch = text.match(
        /\b(20\d{2}-\d{2}-\d{2})[ t](\d{2}:\d{2})\b/
    )
    if (isoMatch) {
        return `${isoMatch[1]}T${isoMatch[2]}`
    }

    const slashMatch = text.match(
        /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b.*?\b(\d{1,2}):(\d{2})\b/i
    )

    if (slashMatch) {
        const day = String(slashMatch[1]).padStart(2, '0')
        const month = String(slashMatch[2]).padStart(2, '0')
        const year = slashMatch[3]
        const hour = String(slashMatch[4]).padStart(2, '0')
        const minute = slashMatch[5]

        return `${year}-${month}-${day}T${hour}:${minute}`
    }

    return null
}

function inferSummary(text) {
    const clean = String(text || '').trim()
    if (!clean) return ''

    const withMatch = clean.match(/(?:con|with)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ0-9 _-]+)/i)
    const person = withMatch ? withMatch[1].trim() : ''

    if (/baldur/i.test(clean)) {
        return person ? `Baldur's Gate 3 con ${person}` : `Baldur's Gate 3`
    }

    if (/dinner|cena/i.test(clean)) {
        return person ? `Cena con ${person}` : 'Cena'
    }

    if (/meeting|reunión|reunion|llamada|call/i.test(clean)) {
        return person ? `Reunión con ${person}` : 'Reunión'
    }

    return clean.length > 80 ? `${clean.slice(0, 77)}...` : clean
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
        const body = parseBody(event.body)
        const message = String(body?.message || '').trim()
        const timeZone = String(body?.timeZone || 'Europe/Dublin').trim()
        const conversation = body?.conversation || []

        if (!message) {
            throw new Error('Falta el mensaje del usuario.')
        }

        const fullContext = `${extractConversationText(conversation)}\nuser: ${message}`
        const summary = inferSummary(fullContext)
        const startDateTime = inferDateTime(fullContext)
        const durationMinutes = inferDurationMinutes(fullContext)
        const location = inferLocation(fullContext)

        if (!startDateTime) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'needs_more_info',
                    assistantMessage:
                        'Entiendo la idea general. ¿Qué fecha y hora exactas debería tener el evento? Puedes escribir algo como 2026-04-10 19:30.',
                    missingFields: ['startDateTime'],
                    draft: {
                        summary,
                        location,
                        durationMinutes: durationMinutes || 60,
                        timeZone
                    }
                })
            }
        }

        if (!durationMinutes) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'needs_more_info',
                    assistantMessage:
                        'Perfecto. Ya tengo la fecha y hora. ¿Cuánto debería durar el evento en minutos u horas?',
                    missingFields: ['durationMinutes'],
                    draft: {
                        summary,
                        startDateTime,
                        location,
                        timeZone
                    }
                })
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'ready',
                assistantMessage: 'Ya tengo la información necesaria para generar la vista previa del evento.',
                draft: {
                    summary: summary || 'Evento generado con IA',
                    startDateTime,
                    durationMinutes,
                    location,
                    description: '',
                    timeZone,
                    uid: '',
                    status: 'CONFIRMED',
                    productId: '-//Santiago Haspert Piaggio//Calendar ICS//EN',
                    categories: [],
                    notes: ''
                }
            })
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: err.message || 'No se pudo generar el draft con IA.'
            })
        }
    }
}