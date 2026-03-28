// functions/oauth2-initiateAuth.cjs

exports.handler = async function () {
    return {
        statusCode: 410,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            error: 'Endpoint deprecado. La app ahora usa Google Identity Services en frontend para asignar calendario.'
        })
    }
}