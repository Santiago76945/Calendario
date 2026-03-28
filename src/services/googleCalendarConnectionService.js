// src/services/googleCalendarConnectionService.js

import {
    clearFullCalendarConnection,
    getGoogleAccessToken,
    getGoogleConnectedEmail,
    isGoogleSessionActive,
    saveAssignedCalendar,
    saveGoogleSession
} from './calendarConfigStorageService'

const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const GOOGLE_CALENDAR_SCOPE =
    'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email'

let googleScriptPromise = null

function getGoogleClientId() {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

function ensureGoogleClientId() {
    const clientId = getGoogleClientId()

    if (!clientId) {
        throw new Error(
            'Falta VITE_GOOGLE_CLIENT_ID. Revisa la configuración del frontend.'
        )
    }

    return clientId
}

export function loadGoogleIdentityScript() {
    if (googleScriptPromise) {
        return googleScriptPromise
    }

    googleScriptPromise = new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) {
            resolve()
            return
        }

        const existing = document.querySelector(
            `script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`
        )

        if (existing) {
            if (window.google?.accounts?.oauth2) {
                resolve()
                return
            }

            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener(
                'error',
                () => reject(new Error('No se pudo cargar Google Identity Services.')),
                { once: true }
            )
            return
        }

        const script = document.createElement('script')
        script.src = GOOGLE_IDENTITY_SCRIPT_URL
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () =>
            reject(new Error('No se pudo cargar Google Identity Services.'))

        document.head.appendChild(script)
    })

    return googleScriptPromise
}

function requestGoogleAccessToken({ prompt = 'consent' } = {}) {
    return new Promise((resolve, reject) => {
        const clientId = ensureGoogleClientId()

        if (!window.google?.accounts?.oauth2) {
            reject(new Error('Google Identity Services no está disponible.'))
            return
        }

        let settled = false

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GOOGLE_CALENDAR_SCOPE,
            callback: (response) => {
                if (settled) return
                settled = true

                if (!response || response.error) {
                    reject(
                        new Error(
                            response?.error_description ||
                                response?.error ||
                                'Google no devolvió un token válido.'
                        )
                    )
                    return
                }

                const accessToken = String(response.access_token || '').trim()
                const expiresInSeconds = Number(response.expires_in || 0)

                if (
                    !accessToken ||
                    !Number.isFinite(expiresInSeconds) ||
                    expiresInSeconds <= 0
                ) {
                    reject(new Error('Google devolvió un token inválido.'))
                    return
                }

                resolve({
                    accessToken,
                    expiresAt: Date.now() + expiresInSeconds * 1000
                })
            }
        })

        try {
            tokenClient.requestAccessToken({ prompt })
        } catch (error) {
            reject(
                error instanceof Error
                    ? error
                    : new Error('No se pudo solicitar el token de Google.')
            )
        }
    })
}

export async function requestAccessTokenInteractive() {
    await loadGoogleIdentityScript()
    return requestGoogleAccessToken({ prompt: 'consent' })
}

export async function requestAccessTokenSilently() {
    await loadGoogleIdentityScript()
    return requestGoogleAccessToken({ prompt: '' })
}

export async function fetchGoogleJson(url, accessToken) {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    const contentType = res.headers.get('content-type') || ''

    if (!res.ok) {
        let detail = res.statusText

        try {
            if (contentType.includes('application/json')) {
                const json = await res.json()
                detail =
                    json?.error?.message ||
                    json?.error_description ||
                    JSON.stringify(json)
            } else {
                detail = await res.text()
            }
        } catch (error) {
            console.error('No se pudo leer el error de Google:', error)
        }

        throw new Error(`Error ${res.status}: ${detail}`)
    }

    if (!contentType.includes('application/json')) {
        throw new Error('Google devolvió una respuesta no JSON.')
    }

    return res.json()
}

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

export async function ensureGoogleCalendarConnection() {
    const session = await requestAccessTokenInteractive()
    const email = await fetchGoogleUserEmail(session.accessToken)

    saveGoogleSession({
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
        email
    })

    return {
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
        email
    }
}

export async function listAccessibleCalendars() {
    const accessToken = getGoogleAccessToken()

    if (!accessToken || !isGoogleSessionActive()) {
        throw new Error('La sesión de Google no está activa.')
    }

    const json = await fetchGoogleJson(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        accessToken
    )

    return Array.isArray(json?.items)
        ? json.items.map((item) => ({
              id: String(item.id || '').trim(),
              summary: String(item.summary || '').trim(),
              description: String(item.description || '').trim(),
              timeZone: String(item.timeZone || '').trim(),
              primary: Boolean(item.primary),
              accessRole: String(item.accessRole || '').trim(),
              backgroundColor: String(item.backgroundColor || '').trim(),
              foregroundColor: String(item.foregroundColor || '').trim()
          }))
        : []
}

export async function connectAndFetchCalendars() {
    if (!isGoogleSessionActive()) {
        await ensureGoogleCalendarConnection()
    }

    return listAccessibleCalendars()
}

export function assignCalendar(calendar) {
    saveAssignedCalendar(calendar)
}

export function disconnectGoogleCalendar() {
    const token = getGoogleAccessToken()

    if (token && window.google?.accounts?.oauth2?.revoke) {
        try {
            window.google.accounts.oauth2.revoke(token, () => {
                clearFullCalendarConnection()
            })
            return
        } catch (error) {
            console.error('No se pudo revocar el token de Google:', error)
        }
    }

    clearFullCalendarConnection()
}

export function getGoogleConnectionSummary() {
    return {
        active: isGoogleSessionActive(),
        email: getGoogleConnectedEmail()
    }
}