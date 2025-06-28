// src/services/calendarService.js

const BASE = '/.netlify/functions/eventos'

async function handleResponse(res) {
    const payload = await res.json().catch(() => ({}))

    if (res.status === 401 && payload.oauthRequired) {
        // No hay refresh_token o expiró: lanzamos el flujo OAuth
        window.location.href = '/.netlify/functions/oauth2/initiateAuth'
        throw new Error('OAuthRequired')
    }

    if (!res.ok) {
        const msg = payload.error || res.statusText
        throw new Error(msg)
    }

    return payload
}

export function getEventos() {
    return fetch(BASE, {
        method: 'GET'
    }).then(handleResponse)
}

export function createEvento(data) {
    return fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse)
}

export function updateEvento(id, data) {
    return fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse)
}

export function deleteEvento(id) {
    return fetch(`${BASE}/${id}`, {
        method: 'DELETE'
    }).then(res => {
        if (res.status === 401) {
            // Si nos pide OAuth, redirigimos igual
            window.location.href = '/.netlify/functions/oauth2/initiateAuth'
            throw new Error('OAuthRequired')
        }
        if (!res.ok) {
            return res.text().then(text => {
                throw new Error(text || res.statusText)
            })
        }
        return
    })
}
