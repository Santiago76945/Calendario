// functions/eventos/index.cjs

const { obtenerEventos, crearEvento, actualizarEvento, eliminarEvento, OAuthRequiredError } = require('./googleCalendarService.cjs')

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers }
    }

    // GET /api/eventos
    if (event.httpMethod === 'GET') {
        try {
            const items = await obtenerEventos()
            return { statusCode: 200, headers, body: JSON.stringify(items) }
        } catch (err) { /* …igual que antes… */ }
    }

    // POST /api/eventos
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body)
            const nuevo = await crearEvento(data)
            return { statusCode: 201, headers, body: JSON.stringify(nuevo) }
        } catch (err) { /* …igual que antes… */ }
    }

    // PUT /api/eventos/:id
    if (event.httpMethod === 'PUT') {
        try {
            const parts = event.path.split('/')
            const id = parts[parts.length - 1]
            const data = JSON.parse(event.body)
            const actualizado = await actualizarEvento(id, data)
            return { statusCode: 200, headers, body: JSON.stringify(actualizado) }
        } catch (err) { /* …igual que antes… */ }
    }

    // DELETE /api/eventos/:id
    if (event.httpMethod === 'DELETE') {
        try {
            const parts = event.path.split('/')
            const id = parts[parts.length - 1]
            await eliminarEvento(id)
            return { statusCode: 204, headers, body: '' }
        } catch (err) {
            console.error(err)
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error al eliminar evento' }) }
        }
    }

    // Método no soportado
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' })
    }
}
