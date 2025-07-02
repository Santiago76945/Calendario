// src/services/calendarService.js

const API_BASE = '/api/eventos'

/**
 * Construye opciones de fetch incluyendo el refresh token desde localStorage
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} url
 * @param {object} [body]
 */
function withAuthOptions(method, url, body) {
    const token = localStorage.getItem('gcal_refresh_token') || ''
    const headers = {
        'Content-Type': 'application/json',
        'X-Gcal-Refresh-Token': token
    }

    const opts = { method, headers }
    if (body) opts.body = JSON.stringify(body)
    return fetch(url, opts)
}

export async function getEventos() {
    const res = await withAuthOptions('GET', API_BASE)
    if (res.status === 401) {
        // Si el backend dice que necesita OAuth, redirigimos al flujo
        window.location.href = '/.netlify/functions/oauth2-initiateAuth'
        return new Promise(() => { }) // Promise que nunca resuelve
    }
    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return res.json()
}

export async function createEvento(eventoData) {
    const res = await withAuthOptions('POST', API_BASE, eventoData)
    if (res.status === 401) {
        window.location.href = '/.netlify/functions/oauth2-initiateAuth'
        return new Promise(() => { })
    }
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Error ${res.status}: ${text}`)
    }
    return res.json()
}

export async function updateEvento(id, eventoData) {
    const res = await withAuthOptions('PUT', `${API_BASE}/${id}`, eventoData)
    if (res.status === 401) {
        window.location.href = '/.netlify/functions/oauth2-initiateAuth'
        return new Promise(() => { })
    }
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Error ${res.status}: ${text}`)
    }
    return res.json()
}

export async function deleteEvento(id) {
    const res = await withAuthOptions('DELETE', `${API_BASE}/${id}`)
    if (res.status === 401) {
        window.location.href = '/.netlify/functions/oauth2-initiateAuth'
        return new Promise(() => { })
    }
    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return true
}
