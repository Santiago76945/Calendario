// functions/eventos/update.js
const { actualizarEvento } = require('./googleCalendarService')

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) }
    }

    // Extraer ID del path: /api/eventos/:id → event.path = "/api/eventos/abc"
    const parts = event.path.split('/')
    const id = parts[parts.length - 1]

    try {
        const data = JSON.parse(event.body)
        const actualizado = await actualizarEvento(id, data)
        return { statusCode: 200, headers, body: JSON.stringify(actualizado) }
    } catch (err) {
        console.error(err)
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error al actualizar evento' }) }
    }
}
