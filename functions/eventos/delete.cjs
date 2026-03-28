// functions/eventos/delete.cjs

exports.handler = async function () {
    return {
        statusCode: 410,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            error: 'Endpoint deprecado. Usa /api/eventos/:id con método DELETE.'
        })
    }
}