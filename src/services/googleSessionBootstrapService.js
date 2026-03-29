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

function buildRefreshedResult({ assignedCalendar, email }) {
    if (assignedCalendar?.id) {
        return {
            status: 'refreshed',
            restored: true,
            needsReconnect: false,
            message: email
                ? `Se restauró la sesión de Google para ${email} y se mantuvo el calendario asignado.`
                : 'Se restauró la sesión de Google y se mantuvo el calendario asignado.'
        }
    }

    return {
        status: 'refreshed',
        restored: true,
        needsReconnect: false,
        message: email
            ? `Se restauró la sesión de Google para ${email}.`
            : 'Se restauró la sesión de Google.'
    }
}

function buildReconnectResult(snapshot) {
    const assignedCalendar = getAssignedCalendar()
    const email = String(snapshot?.email || '').trim()

    if (assignedCalendar?.id) {
        return {
            status: 'needs_reconnect',
            restored: false,
            needsReconnect: true,
            message: email
                ? `La sesión de Google de ${email} ya no está activa. El calendario asignado sigue guardado, pero debes reconectar Google para seguir usándolo.`
                : 'La sesión de Google ya no está activa. El calendario asignado sigue guardado, pero debes reconectar Google para seguir usándolo.'
        }
    }

    if (email) {
        return {
            status: 'needs_reconnect',
            restored: false,
            needsReconnect: true,
            message: `La sesión de Google de ${email} ya no está activa. Debes reconectar Google para continuar.`
        }
    }

    return {
        status: 'needs_reconnect',
        restored: false,
        needsReconnect: true,
        message: 'Debes conectar Google para continuar.'
    }
}

export async function bootstrapGoogleCalendarSession() {
    const snapshot = getGoogleSessionSnapshot()

    if (snapshot.active) {
        return buildActiveResult()
    }

    const hasPreviousGoogleContext =
        hasStoredGoogleSession() || hasAssignedCalendar()

    if (!hasPreviousGoogleContext) {
        return buildIdleResult()
    }

    try {
        await loadGoogleIdentityScript()

        const session = await requestAccessTokenSilently()
        const email =
            snapshot.email || (await fetchGoogleUserEmail(session.accessToken))
        const assignedCalendar = getAssignedCalendar()

        saveGoogleSession({
            accessToken: session.accessToken,
            expiresAt: session.expiresAt,
            email
        })

        return buildRefreshedResult({
            assignedCalendar,
            email
        })
    } catch (error) {
        console.error(
            'No se pudo restaurar la sesión Google automáticamente:',
            error
        )

        clearGoogleSession({
            preserveEmail: Boolean(snapshot.email)
        })

        return buildReconnectResult(snapshot)
    }
}