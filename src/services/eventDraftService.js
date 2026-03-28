// src/services/eventDraftService.js

import {
    addMinutesToLocalDateTime,
    combineDateAndTime,
    formatDateForInput,
    formatTimeForInput,
    formatLocalDateTimeForDisplay,
    getDurationMinutesBetweenLocalDateTimes,
    isValidLocalDateTimeString
} from '../utils/dateTime'

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

export function getDefaultDateInputValue() {
    return formatDateForInput(new Date())
}

export function getDefaultTimeInputValue() {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)

    return formatTimeForInput(now)
}

export function createInitialDraftState({
    timeZone,
    defaultDate,
    defaultStartTime,
    defaultDurationMinutes
}) {
    return {
        summary: '',
        date: defaultDate || getDefaultDateInputValue(),
        time: defaultStartTime || getDefaultTimeInputValue(),
        durationMinutes: String(defaultDurationMinutes || 60),
        location: '',
        timeZone: String(timeZone || DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE,
        description: '',
        uid: '',
        status: 'CONFIRMED',
        productId: DEFAULT_PRODUCT_ID,
        categories: '',
        notes: ''
    }
}

export function createDraftFromEvent(evento, fallbackTimeZone) {
    const safeTimeZone =
        String(
            evento?.timeZone ||
                evento?.start?.timeZone ||
                evento?.end?.timeZone ||
                fallbackTimeZone ||
                DEFAULT_TIMEZONE
        ).trim() || DEFAULT_TIMEZONE

    const startValue = extractEventStart(evento)
    const endValue = extractEventEnd(evento)

    const normalizedStart = normalizeIncomingDateTimeValue(startValue, safeTimeZone)
    const normalizedEnd = normalizeIncomingDateTimeValue(endValue, safeTimeZone)

    const safeDate = normalizedStart
        ? normalizedStart.slice(0, 10)
        : getDefaultDateInputValue()

    const safeTime = normalizedStart
        ? normalizedStart.slice(11, 16)
        : getDefaultTimeInputValue()

    const durationMinutes = getDurationMinutesFromValues(normalizedStart, normalizedEnd)

    return {
        summary: String(evento?.summary || '').trim(),
        date: safeDate,
        time: safeTime,
        durationMinutes: String(durationMinutes || 60),
        location: String(evento?.location || '').trim(),
        timeZone: safeTimeZone,
        description: String(evento?.description || '').trim(),
        uid: String(evento?.uid || '').trim(),
        status: String(evento?.status || 'CONFIRMED').trim(),
        productId: String(evento?.productId || DEFAULT_PRODUCT_ID).trim(),
        categories: Array.isArray(evento?.categories)
            ? evento.categories.join(', ')
            : String(evento?.categories || '').trim(),
        notes: String(evento?.notes || '').trim()
    }
}

export function combineDateAndTimeToLocalDateTime(dateValue, timeValue) {
    return combineDateAndTime(dateValue, timeValue)
}

export function buildDraftFromFormState(formState) {
    const startDateTime =
        String(formState?.startDateTime || '').trim() ||
        combineDateAndTime(formState?.date, formState?.time)

    const durationMinutes = Number(formState?.durationMinutes || 0)

    if (!isValidLocalDateTimeString(startDateTime)) {
        throw new Error('Debes indicar una fecha y hora de inicio válidas.')
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error('La duración debe ser mayor que cero.')
    }

    const endDateTime = addMinutesToLocalDateTime(startDateTime, durationMinutes)

    return normalizeDraft({
        summary: formState?.summary,
        description: formState?.description,
        location: formState?.location,
        startDateTime,
        endDateTime,
        durationMinutes,
        timeZone: formState?.timeZone,
        uid: formState?.uid,
        status: formState?.status || 'CONFIRMED',
        productId: formState?.productId || DEFAULT_PRODUCT_ID,
        categories: splitCommaValues(formState?.categories),
        notes: formState?.notes
    })
}

export function buildSimpleDraftFromAiPayload(payload) {
    const startDateTime = String(payload?.startDateTime || '').trim()
    const durationMinutes = Number(payload?.durationMinutes || 0)

    if (!isValidLocalDateTimeString(startDateTime)) {
        throw new Error('La IA no devolvió una fecha de inicio válida.')
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error('La IA no devolvió una duración válida.')
    }

    const providedEndDateTime = String(payload?.endDateTime || '').trim()
    const endDateTime =
        isValidLocalDateTimeString(providedEndDateTime)
            ? providedEndDateTime
            : addMinutesToLocalDateTime(startDateTime, durationMinutes)

    return normalizeDraft({
        summary: payload?.summary,
        description: payload?.description,
        location: payload?.location,
        startDateTime,
        endDateTime,
        durationMinutes,
        timeZone: payload?.timeZone,
        uid: payload?.uid,
        status: payload?.status || 'CONFIRMED',
        productId: payload?.productId || DEFAULT_PRODUCT_ID,
        categories: splitCommaValues(payload?.categories),
        notes: payload?.notes
    })
}

export function createDraftSummary(draft) {
    return {
        title: draft?.summary || 'Sin título',
        start: draft?.startDateTime
            ? formatLocalDateTimeForDisplay(draft.startDateTime)
            : '',
        end: draft?.endDateTime
            ? formatLocalDateTimeForDisplay(draft.endDateTime)
            : '',
        location: draft?.location || '-',
        timeZone: draft?.timeZone || '-',
        durationMinutes: draft?.durationMinutes || 0
    }
}

export function normalizeDraft(draft) {
    const normalized = {
        summary: String(draft?.summary || '').trim(),
        description: String(draft?.description || '').trim(),
        location: String(draft?.location || '').trim(),
        startDateTime: String(draft?.startDateTime || '').trim(),
        endDateTime: String(draft?.endDateTime || '').trim(),
        durationMinutes: Number(draft?.durationMinutes || 0),
        timeZone: String(draft?.timeZone || DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE,
        uid: String(draft?.uid || '').trim(),
        status: String(draft?.status || 'CONFIRMED').trim(),
        productId: String(draft?.productId || DEFAULT_PRODUCT_ID).trim(),
        categories: splitCommaValues(draft?.categories),
        notes: String(draft?.notes || '').trim()
    }

    if (!isValidLocalDateTimeString(normalized.startDateTime)) {
        throw new Error('startDateTime inválido.')
    }

    if (!isValidLocalDateTimeString(normalized.endDateTime)) {
        throw new Error('endDateTime inválido.')
    }

    const diffMinutes = getDurationMinutesBetweenLocalDateTimes(
        normalized.startDateTime,
        normalized.endDateTime
    )

    if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio.')
    }

    if (!Number.isFinite(normalized.durationMinutes) || normalized.durationMinutes <= 0) {
        normalized.durationMinutes = diffMinutes
    }

    return normalized
}

function splitCommaValues(value) {
    if (!value) return []

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean)
    }

    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

function extractEventStart(evento) {
    return evento?.start?.dateTime || evento?.start?.date || evento?.start || ''
}

function extractEventEnd(evento) {
    return evento?.end?.dateTime || evento?.end?.date || evento?.end || ''
}

function normalizeIncomingDateTimeValue(value, timeZone) {
    const raw = String(value || '').trim()

    if (!raw) {
        return ''
    }

    if (isValidLocalDateTimeString(raw)) {
        return raw
    }

    return toLocalDateTimeInTimeZone(raw, timeZone)
}

function getDurationMinutesFromValues(startValue, endValue) {
    if (!startValue || !endValue) {
        return 60
    }

    const diff = getDurationMinutesBetweenLocalDateTimes(startValue, endValue)
    return Number.isFinite(diff) && diff > 0 ? diff : 60
}