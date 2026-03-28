// src/utils/dateTime.js

function pad(value) {
    return String(value).padStart(2, '0')
}

export function formatDateForInput(date = new Date()) {
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())

    return `${year}-${month}-${day}`
}

export function formatTimeForInput(date = new Date()) {
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    return `${hours}:${minutes}`
}

export function combineDateAndTime(dateValue, timeValue) {
    if (!dateValue || !timeValue) {
        return ''
    }

    return `${dateValue}T${timeValue}`
}

export function isValidLocalDateTimeString(value) {
    return /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.test(
        String(value || '').trim()
    )
}

export function parseLocalDateTimeParts(localDateTime) {
    const match = String(localDateTime || '')
        .trim()
        .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)

    if (!match) {
        return null
    }

    const [, year, month, day, hours, minutes] = match

    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hours: Number(hours),
        minutes: Number(minutes)
    }
}

export function toUtcMillisFromLocalDateTime(localDateTime) {
    const parts = parseLocalDateTimeParts(localDateTime)

    if (!parts) {
        return NaN
    }

    return Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hours,
        parts.minutes,
        0,
        0
    )
}

export function addMinutesToLocalDateTime(localDateTime, minutesToAdd) {
    const baseUtcMillis = toUtcMillisFromLocalDateTime(localDateTime)
    const safeMinutesToAdd = Number(minutesToAdd || 0)

    if (!Number.isFinite(baseUtcMillis) || !Number.isFinite(safeMinutesToAdd)) {
        return ''
    }

    return toLocalDateTimeString(new Date(baseUtcMillis + safeMinutesToAdd * 60000))
}

export function toLocalDateTimeString(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return ''
    }

    const year = date.getUTCFullYear()
    const month = pad(date.getUTCMonth() + 1)
    const day = pad(date.getUTCDate())
    const hours = pad(date.getUTCHours())
    const minutes = pad(date.getUTCMinutes())

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getDurationMinutesBetweenLocalDateTimes(startDateTime, endDateTime) {
    const startUtcMillis = toUtcMillisFromLocalDateTime(startDateTime)
    const endUtcMillis = toUtcMillisFromLocalDateTime(endDateTime)

    if (!Number.isFinite(startUtcMillis) || !Number.isFinite(endUtcMillis)) {
        return NaN
    }

    return Math.round((endUtcMillis - startUtcMillis) / 60000)
}

export function formatIcsDateTimeLocal(localDateTime) {
    const parts = parseLocalDateTimeParts(localDateTime)

    if (!parts) {
        throw new Error('Fecha inválida para ICS.')
    }

    return [
        String(parts.year).padStart(4, '0'),
        pad(parts.month),
        pad(parts.day)
    ].join('') + `T${pad(parts.hours)}${pad(parts.minutes)}00`
}

export function formatIcsUtcStamp(date = new Date()) {
    const year = date.getUTCFullYear()
    const month = pad(date.getUTCMonth() + 1)
    const day = pad(date.getUTCDate())
    const hours = pad(date.getUTCHours())
    const minutes = pad(date.getUTCMinutes())
    const seconds = pad(date.getUTCSeconds())

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

export function formatLocalDateTimeForDisplay(value) {
    if (!isValidLocalDateTimeString(value)) {
        return value || '-'
    }

    const [datePart, timePart] = String(value).split('T')
    return `${datePart} ${timePart}`
}

export function tryFormatHumanDateTime(value, locale = undefined, timeZone = '') {
    if (!value) return '-'

    if (isValidLocalDateTimeString(value)) {
        return formatLocalDateTimeForDisplay(value)
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    try {
        if (timeZone) {
            return date.toLocaleString(locale, { timeZone })
        }

        return date.toLocaleString(locale)
    } catch (error) {
        return date.toLocaleString(locale)
    }
}