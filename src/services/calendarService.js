// src/services/calendarService.js

const API_BASE = '/api/eventos'

async function getEventos() {
    const res = await fetch(API_BASE)
    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return res.json()
}

async function createEvento(eventoData) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoData)
    })
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Error ${res.status}: ${text}`)
    }
    return res.json()
}

async function updateEvento(id, eventoData) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoData)
    })
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Error ${res.status}: ${text}`)
    }
    return res.json()
}

async function deleteEvento(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
    })
    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    // DELETE devuelve 204, no hay JSON
    return true
}

export {
    getEventos,
    createEvento,
    updateEvento,
    deleteEvento
}
