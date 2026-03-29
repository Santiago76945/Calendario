// src/services/calendarConfigStorageService.js

import { STORAGE_KEYS } from '../constants/storageKeys'

const SESSION_EXPIRY_SKEW_MS = 60 * 1000

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
    const token = String(accessToken || '').trim()
    const safeExpiresAt = Number(expiresAt || 0)
    const safeEmail = String(email || '').trim()

    if (!token || !Number.isFinite(safeExpiresAt) || safeExpiresAt <= 0) {
        throw new Error('Falta información válida de sesión de Google.')
    }

    safeSetItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, token)
    safeSetItem(
        STORAGE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRES_AT,
        String(safeExpiresAt)
    )

    if (safeEmail) {
        safeSetItem(STORAGE_KEYS.GOOGLE_CONNECTED_EMAIL, safeEmail)
    } else {
        safeRemoveItem(STORAGE_KEYS.GOOGLE_CONNECTED_EMAIL)
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

export function getGoogleSessionSnapshot() {
    const accessToken = getGoogleAccessToken()
    const expiresAt = getGoogleAccessTokenExpiresAt()
    const email = getGoogleConnectedEmail()
    const now = Date.now()

    const hasToken = Boolean(accessToken)
    const hasExpiry = Number.isFinite(expiresAt) && expiresAt > 0
    const hasEmail = Boolean(email)

    const expiresInMs = hasExpiry ? expiresAt - now : 0
    const active = hasToken && hasExpiry && expiresInMs > SESSION_EXPIRY_SKEW_MS
    const expired =
        hasToken && hasExpiry && expiresInMs <= SESSION_EXPIRY_SKEW_MS
    const hasStoredContext = hasToken || hasExpiry || hasEmail

    let status = 'idle'

    if (active) {
        status = 'active'
    } else if (expired) {
        status = 'expired'
    } else if (hasStoredContext) {
        status = 'stored'
    }

    return {
        accessToken,
        expiresAt,
        email,
        hasToken,
        hasExpiry,
        hasEmail,
        hasStoredContext,
        active,
        expired,
        expiresInMs,
        status
    }
}

export function isGoogleSessionActive() {
    return getGoogleSessionSnapshot().active
}

export function hasStoredGoogleSession() {
    return getGoogleSessionSnapshot().hasStoredContext
}

export function clearGoogleSession(options = {}) {
    const preserveEmail = Boolean(options?.preserveEmail)

    safeRemoveItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN)
    safeRemoveItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRES_AT)

    if (!preserveEmail) {
        safeRemoveItem(STORAGE_KEYS.GOOGLE_CONNECTED_EMAIL)
    }
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