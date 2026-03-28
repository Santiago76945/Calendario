// src/services/icsService.js

import { formatIcsDateTimeLocal, formatIcsUtcStamp } from '../utils/dateTime'
import { buildIcsLines, escapeIcsText, sanitizeUidPart } from '../utils/icsText'

const DEFAULT_PRODUCT_ID = '-//Santiago Haspert Piaggio//Calendar ICS//EN'

export function createIcsFromDraft(draft) {
    validateDraftForIcs(draft)

    const uid = buildUid(draft)
    const dtStamp = formatIcsUtcStamp(new Date())
    const dtStart = formatIcsDateTimeLocal(draft.startDateTime)
    const dtEnd = formatIcsDateTimeLocal(draft.endDateTime)
    const productId = draft.productId || DEFAULT_PRODUCT_ID

    const descriptionParts = []

    if (draft.description) {
        descriptionParts.push(draft.description)
    }

    if (draft.durationMinutes) {
        descriptionParts.push(`Duration: ${draft.durationMinutes} minutes.`)
    }

    if (draft.notes) {
        descriptionParts.push(`Notes: ${draft.notes}`)
    }

    const description = descriptionParts.join('\n')

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${escapeIcsText(productId)}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${escapeIcsText(uid)}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART;TZID=${escapeIcsText(draft.timeZone)}:${dtStart}`,
        `DTEND;TZID=${escapeIcsText(draft.timeZone)}:${dtEnd}`,
        `SUMMARY:${escapeIcsText(draft.summary)}`,
        draft.location ? `LOCATION:${escapeIcsText(draft.location)}` : '',
        description ? `DESCRIPTION:${escapeIcsText(description)}` : '',
        draft.status ? `STATUS:${escapeIcsText(draft.status)}` : '',
        draft.categories?.length
            ? `CATEGORIES:${escapeIcsText(draft.categories.join(','))}`
            : '',
        'END:VEVENT',
        'END:VCALENDAR'
    ]

    return `${buildIcsLines(lines)}\r\n`
}

export function validateDraftForIcs(draft) {
    if (!draft || typeof draft !== 'object') {
        throw new Error('No se pudo generar el ICS: draft inválido.')
    }

    if (!String(draft.summary || '').trim()) {
        throw new Error('El evento debe tener nombre.')
    }

    if (!String(draft.startDateTime || '').trim()) {
        throw new Error('El evento debe tener fecha y hora de inicio.')
    }

    if (!String(draft.endDateTime || '').trim()) {
        throw new Error('El evento debe tener fecha y hora de fin.')
    }

    if (!String(draft.timeZone || '').trim()) {
        throw new Error('El evento debe tener zona horaria.')
    }

    const start = new Date(draft.startDateTime)
    const end = new Date(draft.endDateTime)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Las fechas del evento no son válidas.')
    }

    if (end.getTime() <= start.getTime()) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio.')
    }

    if (!Number.isFinite(Number(draft.durationMinutes)) || Number(draft.durationMinutes) <= 0) {
        throw new Error('La duración del evento debe ser válida.')
    }
}

export function validateIcsContent(icsContent) {
    const content = String(icsContent || '').trim()

    if (!content) {
        return {
            ok: false,
            error: 'El contenido ICS está vacío.'
        }
    }

    const requiredParts = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:',
        'DTSTAMP:',
        'DTSTART',
        'DTEND',
        'SUMMARY:',
        'END:VEVENT',
        'END:VCALENDAR'
    ]

    const missing = requiredParts.filter((part) => !content.includes(part))

    if (missing.length > 0) {
        return {
            ok: false,
            error: `Faltan partes obligatorias del ICS: ${missing.join(', ')}`
        }
    }

    return { ok: true }
}

export function buildDraftFromExistingEvent(evento) {
    const startValue = evento?.start?.dateTime || evento?.start?.date || evento?.start || ''
    const endValue = evento?.end?.dateTime || evento?.end?.date || evento?.end || ''

    return {
        summary: String(evento?.summary || '').trim(),
        description: String(evento?.description || '').trim(),
        location: String(evento?.location || '').trim(),
        startDateTime: normalizeEventDateValue(startValue),
        endDateTime: normalizeEventDateValue(endValue),
        durationMinutes: getDurationMinutes(startValue, endValue),
        timeZone:
            String(
                evento?.timeZone ||
                    evento?.start?.timeZone ||
                    evento?.end?.timeZone ||
                    'Europe/Dublin'
            ).trim() || 'Europe/Dublin',
        uid: String(evento?.uid || '').trim(),
        status: String(evento?.status || 'CONFIRMED').trim(),
        productId: String(evento?.productId || DEFAULT_PRODUCT_ID).trim(),
        categories: Array.isArray(evento?.categories) ? evento.categories : [],
        notes: String(evento?.notes || '').trim()
    }
}

function buildUid(draft) {
    if (draft.uid) {
        return draft.uid
    }

    const summaryPart = sanitizeUidPart(draft.summary)
    const locationPart = sanitizeUidPart(draft.location || 'calendar')
    const datePart = formatIcsDateTimeLocal(draft.startDateTime)

    return `${summaryPart}-${locationPart}-${datePart}@calendar.local`
}

function normalizeEventDateValue(value) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getDurationMinutes(startValue, endValue) {
    const start = new Date(startValue)
    const end = new Date(endValue)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 60
    }

    const diff = Math.round((end.getTime() - start.getTime()) / 60000)
    return diff > 0 ? diff : 60
}