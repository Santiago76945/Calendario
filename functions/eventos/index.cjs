// functions/eventos/index.cjs

const {
    obtenerEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    OAuthRequiredError
} = require('./googleCalendarService.cjs')

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        // Permitimos el header personalizado para el refresh token
        'Access-Control-Allow-Headers': 'Content-Type, X-Gcal-Refresh-Token'
    }

    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers }
    }

    // Recuperamos el token enviado desde el front
    const refreshToken = event.headers['x-gcal-refresh-token'] || ''

    try {
        // extraemos el ID si viene en la ruta /api/eventos/:id
        const parts = event.path.split('/')
        const id = parts[parts.length - 1]

        switch (event.httpMethod) {
            case 'GET': {
                const items = await obtenerEventos(refreshToken)
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(items)
                }
            }

            case 'POST': {
                const data = JSON.parse(event.body)
                const nuevo = await crearEvento(refreshToken, data)
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify(nuevo)
                }
            }

            case 'PUT': {
                const data = JSON.parse(event.body)
                const actualizado = await actualizarEvento(refreshToken, id, data)
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(actualizado)
                }
            }

            case 'DELETE': {
                await eliminarEvento(refreshToken, id)
                return {
                    statusCode: 204,
                    headers,
                    body: ''
                }
            }

            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Método no permitido' })
                }
        }
    } catch (err) {
        if (err instanceof OAuthRequiredError) {
            // Indicamos al front que debe reiniciar el flujo de OAuth
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
            body: JSON.stringify({ error: 'Error interno del servidor' })
        }
    }
}
