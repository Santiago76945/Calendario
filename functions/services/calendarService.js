// src/services/calendarService.js

// Usamos el path lógico /api/... y Netlify se encarga del redirect a /.netlify/functions
const API_BASE = '/api/eventos'

async function handleResponse(res) {
    // Si recibimos 401, redirigimos al flujo OAuth al endpoint que existe
    if (res.status === 401) {
        // Netlify Functions de 'oauth2/initiateAuth.js' expone como 'oauth2-initiateAuth'
        window.location.href = '/api/oauth2-initiateAuth'
        return new Promise(() => { })
    }

    // Parseamos JSON si hay body
    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
        const msg = payload.error || res.statusText
        throw new Error(msg)
    }

    return payload
}

export function getEventos() {
    return fetch(API_BASE, { method: 'GET' }).then(handleResponse)
}

export function createEvento(data) {
    return fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse)
}

export function updateEvento(id, data) {
    return fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse)
}

export function deleteEvento(id) {
    return fetch(`${API_BASE}/${id}`, { method: 'DELETE' }).then(res => {
        if (res.status === 401) {
            window.location.href = '/api/oauth2-initiateAuth'
            return new Promise(() => { })
        }
        if (!res.ok) {
            return res.json().catch(() => ({})).then(payload => {
                const msg = payload.error || res.statusText
                throw new Error(msg)
            })
        }
    })
}
