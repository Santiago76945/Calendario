// src/services/aiEventService.js

export async function requestAiEventStep({ message, timeZone, conversation }) {
    const res = await fetch('/api/ai/event-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            timeZone,
            conversation
        })
    })

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Error ${res.status}: ${text}`)
    }

    const json = await res.json()

    if (!json || typeof json !== 'object') {
        throw new Error('La respuesta del backend de IA no fue válida.')
    }

    if (!json.status || !['needs_more_info', 'ready'].includes(json.status)) {
        throw new Error('La respuesta del backend de IA no tiene un status válido.')
    }

    return json
}