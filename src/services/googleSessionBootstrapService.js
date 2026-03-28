// src/services/googleSessionBootstrapService.js

import {
    clearGoogleSession,
    getAssignedCalendar,
    getGoogleSessionSnapshot,
    hasAssignedCalendar,
    hasStoredGoogleSession,
    saveGoogleSession
} from './calendarConfigStorageService'
import {
    fetchGoogleJson,
    loadGoogleIdentityScript,
    requestAccessTokenSilently
} from './googleCalendarConnectionService'

async function fetchGoogleUserEmail(accessToken) {
    try {
        const me = await fetchGoogleJson(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            accessToken
        )

        return String(me?.email || '').trim()
    } catch (error) {
        console.error('No se pudo obtener el email del usuario Google:', error)
        return ''
    }
}

function buildIdleResult() {
    return {
        status: 'idle',
        restored: false,
        needsReconnect: false,
        message: ''
    }
}

function buildActiveResult() {
    return {
        status: 'active',
        restored: true,
        needsReconnect: false,
        message: ''
    }
}

function buildRefreshedResult() {
    return {
        status: 'refreshed',
        restored: true,
        needsReconnect: false,
        message: ''
    }
}

function buildReconnectResult() {
    const assignedCalendar = getAssignedCalendar()

    return {
        status: 'needs_reconnect',
        restored: false,
        needsReconnect: true,
        message: assignedCalendar?.id
            ? 'La sesión de Google expiró y no pudo restaurarse automáticamente. Debes reconectar Google.'
            : 'Debes conectar Google para continuar.'
    }
}

export async function bootstrapGoogleCalendarSession() {
    const snapshot = getGoogleSessionSnapshot()

    if (snapshot.active) {
        return buildActiveResult()
    }

    const hasPreviousGoogleContext = hasStoredGoogleSession() || hasAssignedCalendar()

    if (!hasPreviousGoogleContext) {
        return buildIdleResult()
    }

    try {
        await loadGoogleIdentityScript()

        const session = await requestAccessTokenSilently()
        const email =
            snapshot.email || (await fetchGoogleUserEmail(session.accessToken))

        saveGoogleSession({
            accessToken: session.accessToken,
            expiresAt: session.expiresAt,
            email
        })

        return buildRefreshedResult()
    } catch (error) {
        console.error('No se pudo restaurar la sesión Google automáticamente:', error)
        clearGoogleSession()
        return buildReconnectResult()
    }
}