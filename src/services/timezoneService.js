// src/services/timezoneService.js

import {
    DEFAULT_TIMEZONE,
    MANUAL_TIMEZONE_OPTION,
    POPULAR_TIMEZONES
} from '../constants/timezones'
import { STORAGE_KEYS } from '../constants/storageKeys'

export function getPopularTimezones() {
    return POPULAR_TIMEZONES
}

export function isPopularTimezone(timezone) {
    return POPULAR_TIMEZONES.some((item) => item.value === timezone)
}

export function getSavedTimezone() {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.TIMEZONE_PREFERENCE)

        if (stored && typeof stored === 'string') {
            return stored
        }
    } catch (error) {
        console.error('No se pudo leer la zona horaria guardada:', error)
    }

    return DEFAULT_TIMEZONE
}

export function saveTimezonePreference(timezone) {
    if (!timezone || typeof timezone !== 'string') {
        return
    }

    try {
        window.localStorage.setItem(STORAGE_KEYS.TIMEZONE_PREFERENCE, timezone)
    } catch (error) {
        console.error('No se pudo guardar la zona horaria:', error)
    }
}

export function getTimezoneSelectValue(timezone) {
    if (isPopularTimezone(timezone)) {
        return timezone
    }

    return MANUAL_TIMEZONE_OPTION
}

export function getAiDraftTimezone() {
    try {
        return (
            window.localStorage.getItem(STORAGE_KEYS.AI_DRAFT_TIMEZONE) ||
            getSavedTimezone()
        )
    } catch (error) {
        console.error('No se pudo leer la zona horaria temporal de IA:', error)
        return getSavedTimezone()
    }
}

export function saveAiDraftTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') {
        return
    }

    try {
        window.localStorage.setItem(STORAGE_KEYS.AI_DRAFT_TIMEZONE, timezone)
    } catch (error) {
        console.error('No se pudo guardar la zona horaria temporal de IA:', error)
    }
}

export function clearAiDraftTimezone() {
    try {
        window.localStorage.removeItem(STORAGE_KEYS.AI_DRAFT_TIMEZONE)
    } catch (error) {
        console.error('No se pudo limpiar la zona horaria temporal de IA:', error)
    }
}