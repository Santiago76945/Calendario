// src/services/calendarConfigStorageService.js

import { STORAGE_KEYS } from '../constants/storageKeys'

function safeGetItem(key) {
    try {
        return window.localStorage.getItem(key)
    } catch (error) {
        console.error(`No se pudo leer localStorage para ${key}:`, error)
        return null
    }
}

function safeSetItem(key, value) {
    try {
        window.localStorage.setItem(key, value)
    } catch (error) {
        console.error(`No se pudo guardar localStorage para ${key}:`, error)
    }
}

function safeRemoveItem(key) {
    try {
        window.localStorage.removeItem(key)
    } catch (error) {
        console.error(`No se pudo limpiar localStorage para ${key}:`, error)
    }
}

export function saveGoogleSession({
    accessToken,
    expiresAt,
    email = ''
}) {
    if (!accessToken || !expiresAt) {
        throw new Error('Falta información de sesión de Google.')
    }

    safeSetItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, String(accessToken))
    safeSetItem(
        STORAGE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRES_AT,
        String(expiresAt)
    )

    if (email) {
        safeSetItem(STORAGE_KEYS.GOOGLE_CONNECTED_EMAIL, String(email))
    }
}

export function getGoogleAccessToken() {
    const token = safeGetItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN)
    return token ? String(token).trim() : ''
}

export function getGoogleAccessTokenExpiresAt() {
    const raw = safeGetItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRES_AT)
    const value = Number(raw || 0)
    return Number.isFinite(value) ? value : 0
}

export function getGoogleConnectedEmail() {
    const value = safeGetItem(STORAGE_KEYS.GOOGLE_CONNECTED_EMAIL)
    return value ? String(value).trim() : ''
}

export function isGoogleSessionActive() {
    const token = getGoogleAccessToken()
    const expiresAt = getGoogleAccessTokenExpiresAt()

    if (!token || !expiresAt) {
        return false
    }

    return Date.now() < expiresAt
}

export function clearGoogleSession() {
    safeRemoveItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN)
    safeRemoveItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRES_AT)
    safeRemoveItem(STORAGE_KEYS.GOOGLE_CONNECTED_EMAIL)
}

export function saveAssignedCalendar(calendar) {
    if (!calendar || typeof calendar !== 'object') {
        throw new Error('No se pudo guardar el calendario asignado.')
    }

    const id = String(calendar.id || '').trim()
    const summary = String(calendar.summary || '').trim()

    if (!id) {
        throw new Error('El calendario debe tener ID.')
    }

    safeSetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_ID, id)
    safeSetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_SUMMARY, summary)
    safeSetItem(
        STORAGE_KEYS.ASSIGNED_CALENDAR_TIMEZONE,
        String(calendar.timeZone || '').trim()
    )
    safeSetItem(
        STORAGE_KEYS.ASSIGNED_CALENDAR_BACKGROUND,
        String(calendar.backgroundColor || '').trim()
    )
    safeSetItem(
        STORAGE_KEYS.ASSIGNED_CALENDAR_FOREGROUND,
        String(calendar.foregroundColor || '').trim()
    )
}

export function getAssignedCalendar() {
    const id = safeGetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_ID)

    if (!id) {
        return null
    }

    return {
        id: String(id).trim(),
        summary: String(
            safeGetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_SUMMARY) || ''
        ).trim(),
        timeZone: String(
            safeGetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_TIMEZONE) || ''
        ).trim(),
        backgroundColor: String(
            safeGetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_BACKGROUND) || ''
        ).trim(),
        foregroundColor: String(
            safeGetItem(STORAGE_KEYS.ASSIGNED_CALENDAR_FOREGROUND) || ''
        ).trim()
    }
}

export function hasAssignedCalendar() {
    const calendar = getAssignedCalendar()
    return Boolean(calendar?.id)
}

export function clearAssignedCalendar() {
    safeRemoveItem(STORAGE_KEYS.ASSIGNED_CALENDAR_ID)
    safeRemoveItem(STORAGE_KEYS.ASSIGNED_CALENDAR_SUMMARY)
    safeRemoveItem(STORAGE_KEYS.ASSIGNED_CALENDAR_TIMEZONE)
    safeRemoveItem(STORAGE_KEYS.ASSIGNED_CALENDAR_BACKGROUND)
    safeRemoveItem(STORAGE_KEYS.ASSIGNED_CALENDAR_FOREGROUND)
}

export function clearFullCalendarConnection() {
    clearAssignedCalendar()
    clearGoogleSession()
}