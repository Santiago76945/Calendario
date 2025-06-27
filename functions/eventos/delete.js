// functions/eventos/delete.js
const { eliminarEvento } = require('./googleCalendarService')

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) }
    }

    const parts = event.path.split('/')
    const id = parts[parts.length - 1]

    try {
        await eliminarEvento(id)
        return { statusCode: 204, headers, body: '' }
    } catch (err) {
        console.error(err)
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error al eliminar evento' }) }
    }
}
