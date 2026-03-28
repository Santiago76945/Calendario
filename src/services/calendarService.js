// src/services/calendarService.js

import {
    clearFullCalendarConnection,
    getAssignedCalendar,
    getGoogleAccessToken,
    isGoogleSessionActive
} from './calendarConfigStorageService'

const API_BASE = '/api/eventos'
const ICS_BASE = '/api/ics'

function buildAuthorizedHeaders(extraHeaders = {}) {
    const accessToken = getGoogleAccessToken()
    const assignedCalendar = getAssignedCalendar()

    if (!accessToken || !isGoogleSessionActive()) {
        throw new Error('La sesión de Google no está activa. Debes asignar un calendario otra vez.')
    }

    if (!assignedCalendar?.id) {
        throw new Error('No hay un calendario asignado.')
    }

    return {
        Authorization: `Bearer ${accessToken}`,
        'X-Calendar-Id': assignedCalendar.id,
        ...extraHeaders
    }
}

async function handleJsonResponse(res) {
    const contentType = res.headers.get('content-type') || ''

    if (!res.ok) {
        let detail = res.statusText

        try {
            if (contentType.includes('application/json')) {
                const json = await res.json()
                detail =
                    json?.error ||
                    json?.message ||
                    JSON.stringify(json)
            } else {
                detail = await res.text()
            }
        } catch (error) {
            console.error('No se pudo interpretar el error de la API:', error)
        }

        if (res.status === 401 || res.status === 403) {
            clearFullCalendarConnection()
        }

        throw new Error(`Error ${res.status}: ${detail}`)
    }

    if (contentType.includes('application/json')) {
        return res.json()
    }

    return null
}

async function getEventos() {
    const res = await fetch(API_BASE, {
        headers: buildAuthorizedHeaders()
    })

    return handleJsonResponse(res)
}

async function createEventoFromDraft(draft, icsContent) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: buildAuthorizedHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            draft,
            icsContent,
            source: 'ics-preview'
        })
    })

    return handleJsonResponse(res)
}

async function updateEventoFromDraft(id, draft, icsContent) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: buildAuthorizedHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            draft,
            icsContent,
            source: 'ics-preview'
        })
    })

    return handleJsonResponse(res)
}

async function deleteEvento(id) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: buildAuthorizedHeaders()
    })

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)

        if (res.status === 401 || res.status === 403) {
            clearFullCalendarConnection()
        }

        throw new Error(`Error ${res.status}: ${text}`)
    }

    return true
}

async function importIcs(icsContent) {
    const res = await fetch(`${ICS_BASE}/import`, {
        method: 'POST',
        headers: buildAuthorizedHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ icsContent })
    })

    return handleJsonResponse(res)
}

async function downloadAllEventosIcs() {
    const res = await fetch(`${ICS_BASE}/export`, {
        method: 'GET',
        headers: buildAuthorizedHeaders()
    })

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)

        if (res.status === 401 || res.status === 403) {
            clearFullCalendarConnection()
        }

        throw new Error(`Error ${res.status}: ${text}`)
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'calendario.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return true
}

export {
    getEventos,
    createEventoFromDraft,
    updateEventoFromDraft,
    deleteEvento,
    importIcs,
    downloadAllEventosIcs
}