// src/services/eventDraftService.js

import {
    addMinutesToLocalDateTime,
    combineDateAndTime,
    formatDateForInput,
    formatTimeForInput,
    toLocalDateTimeString
} from '../utils/dateTime'

const DEFAULT_PRODUCT_ID = '-//Santiago Haspert Piaggio//Calendar ICS//EN'

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
        timeZone,
        description: '',
        uid: '',
        status: 'CONFIRMED',
        productId: DEFAULT_PRODUCT_ID,
        categories: '',
        notes: ''
    }
}

export function createDraftFromEvent(evento, fallbackTimeZone) {
    const startValue = extractEventStart(evento)
    const endValue = extractEventEnd(evento)

    const startDate = parseDateSafely(startValue)

    const safeDate =
        startDate && !Number.isNaN(startDate.getTime())
            ? formatDateForInput(startDate)
            : getDefaultDateInputValue()

    const safeTime =
        startDate && !Number.isNaN(startDate.getTime())
            ? formatTimeForInput(startDate)
            : getDefaultTimeInputValue()

    const durationMinutes = getDurationMinutesFromValues(startValue, endValue)

    return {
        summary: String(evento?.summary || '').trim(),
        date: safeDate,
        time: safeTime,
        durationMinutes: String(durationMinutes || 60),
        location: String(evento?.location || '').trim(),
        timeZone:
            String(
                evento?.timeZone ||
                    evento?.start?.timeZone ||
                    evento?.end?.timeZone ||
                    fallbackTimeZone
            ).trim() || fallbackTimeZone,
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
        formState.startDateTime ||
        combineDateAndTime(formState.date, formState.time)

    const durationMinutes = Number(formState.durationMinutes || 0)

    if (!startDateTime) {
        throw new Error('Debes indicar fecha y hora de inicio.')
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error('La duración debe ser mayor que cero.')
    }

    const endDateTime = addMinutesToLocalDateTime(startDateTime, durationMinutes)

    return normalizeDraft({
        summary: formState.summary,
        description: formState.description,
        location: formState.location,
        startDateTime,
        endDateTime,
        durationMinutes,
        timeZone: formState.timeZone,
        uid: formState.uid,
        status: formState.status || 'CONFIRMED',
        productId: formState.productId || DEFAULT_PRODUCT_ID,
        categories: splitCommaValues(formState.categories),
        notes: formState.notes
    })
}

export function buildSimpleDraftFromAiPayload(payload) {
    const startDateTime = String(payload?.startDateTime || '').trim()
    const durationMinutes = Number(payload?.durationMinutes || 0)

    if (!startDateTime) {
        throw new Error('La IA no devolvió una fecha de inicio válida.')
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error('La IA no devolvió una duración válida.')
    }

    const endDateTime =
        String(payload?.endDateTime || '').trim() ||
        addMinutesToLocalDateTime(startDateTime, durationMinutes)

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
            ? toLocalDateTimeString(new Date(draft.startDateTime))
            : '',
        end: draft?.endDateTime
            ? toLocalDateTimeString(new Date(draft.endDateTime))
            : '',
        location: draft?.location || '-',
        timeZone: draft?.timeZone || '-',
        durationMinutes: draft?.durationMinutes || 0
    }
}

export function normalizeDraft(draft) {
    return {
        summary: String(draft?.summary || '').trim(),
        description: String(draft?.description || '').trim(),
        location: String(draft?.location || '').trim(),
        startDateTime: String(draft?.startDateTime || '').trim(),
        endDateTime: String(draft?.endDateTime || '').trim(),
        durationMinutes: Number(draft?.durationMinutes || 0),
        timeZone: String(draft?.timeZone || '').trim(),
        uid: String(draft?.uid || '').trim(),
        status: String(draft?.status || 'CONFIRMED').trim(),
        productId: String(draft?.productId || DEFAULT_PRODUCT_ID).trim(),
        categories: splitCommaValues(draft?.categories),
        notes: String(draft?.notes || '').trim()
    }
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

function parseDateSafely(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function getDurationMinutesFromValues(startValue, endValue) {
    const start = parseDateSafely(startValue)
    const end = parseDateSafely(endValue)

    if (!start || !end) {
        return 60
    }

    const diff = Math.round((end.getTime() - start.getTime()) / 60000)
    return diff > 0 ? diff : 60
}