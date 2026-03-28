// src/services/icsService.js

import {
    formatIcsDateTimeLocal,
    formatIcsUtcStamp,
    getDurationMinutesBetweenLocalDateTimes,
    isValidLocalDateTimeString
} from '../utils/dateTime'
import { buildIcsLines, escapeIcsText, sanitizeUidPart } from '../utils/icsText'

const DEFAULT_PRODUCT_ID = '-//Santiago Haspert Piaggio//Calendar ICS//EN'
const DEFAULT_TIMEZONE = 'Europe/Dublin'

function pad(value) {
    return String(value).padStart(2, '0')
}

function getDatePartsInTimeZone(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    })

    const parts = formatter.formatToParts(date)
    const map = {}

    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value
        }
    }

    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute)
    }
}

function toLocalDateTimeInTimeZone(value, timeZone) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const parts = getDatePartsInTimeZone(date, timeZone || DEFAULT_TIMEZONE)

    return `${String(parts.year).padStart(4, '0')}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

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

    if (!isValidLocalDateTimeString(draft.startDateTime)) {
        throw new Error('La fecha de inicio no es válida.')
    }

    if (!isValidLocalDateTimeString(draft.endDateTime)) {
        throw new Error('La fecha de fin no es válida.')
    }

    const diffMinutes = getDurationMinutesBetweenLocalDateTimes(
        draft.startDateTime,
        draft.endDateTime
    )

    if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) {
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
    const timeZone =
        String(
            evento?.timeZone ||
                evento?.start?.timeZone ||
                evento?.end?.timeZone ||
                DEFAULT_TIMEZONE
        ).trim() || DEFAULT_TIMEZONE

    const startValue = evento?.startDateTime ||
        evento?.start?.dateTime ||
        evento?.start?.date ||
        evento?.start ||
        ''

    const endValue = evento?.endDateTime ||
        evento?.end?.dateTime ||
        evento?.end?.date ||
        evento?.end ||
        ''

    const normalizedStart = normalizeEventDateValue(startValue, timeZone)
    const normalizedEnd = normalizeEventDateValue(endValue, timeZone)

    return {
        summary: String(evento?.summary || '').trim(),
        description: String(evento?.description || '').trim(),
        location: String(evento?.location || '').trim(),
        startDateTime: normalizedStart,
        endDateTime: normalizedEnd,
        durationMinutes: getDurationMinutes(normalizedStart, normalizedEnd),
        timeZone,
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

function normalizeEventDateValue(value, timeZone) {
    const raw = String(value || '').trim()

    if (!raw) {
        return ''
    }

    if (isValidLocalDateTimeString(raw)) {
        return raw
    }

    return toLocalDateTimeInTimeZone(raw, timeZone)
}

function getDurationMinutes(startValue, endValue) {
    const diff = getDurationMinutesBetweenLocalDateTimes(startValue, endValue)
    return Number.isFinite(diff) && diff > 0 ? diff : 60
}