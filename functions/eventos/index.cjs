// functions/eventos/index.cjs

const {
    obtenerEventos,
    crearEvento,
    OAuthRequiredError
} = require('./googleCalendarService.cjs')

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    // GET /api/eventos
    if (event.httpMethod === 'GET') {
        try {
            const items = await obtenerEventos()
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(items)
            }
        } catch (err) {
            if (err instanceof OAuthRequiredError) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: err.message, oauthRequired: true })
                }
            }
            console.error(err)
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Error al listar eventos' })
            }
        }
    }

    // POST /api/eventos
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body)
            const nuevo = await crearEvento(data)
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(nuevo)
            }
        } catch (err) {
            if (err instanceof OAuthRequiredError) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: err.message, oauthRequired: true })
                }
            }
            console.error(err)
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Error al crear evento' })
            }
        }
    }

    // Método no soportado
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' })
    }
}
