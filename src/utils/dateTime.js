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

export function addMinutesToLocalDateTime(localDateTime, minutesToAdd) {
    const date = new Date(localDateTime)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    date.setMinutes(date.getMinutes() + Number(minutesToAdd || 0))

    return toLocalDateTimeString(date)
}

export function toLocalDateTimeString(date) {
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatIcsDateTimeLocal(localDateTime) {
    const date = new Date(localDateTime)

    if (Number.isNaN(date.getTime())) {
        throw new Error('Fecha inválida para ICS.')
    }

    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    const seconds = pad(date.getSeconds())

    return `${year}${month}${day}T${hours}${minutes}${seconds}`
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

export function tryFormatHumanDateTime(value, locale = undefined) {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString(locale)
}