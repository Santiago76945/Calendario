// src/components/CalendarConnectionStatus.jsx

import React from 'react'
import AssignCalendarButton from './AssignCalendarButton'
import {
    getAssignedCalendar,
    getGoogleConnectedEmail,
    getGoogleSessionSnapshot,
    hasAssignedCalendar
} from '../services/calendarConfigStorageService'
import { disconnectGoogleCalendar } from '../services/googleCalendarConnectionService'

export default function CalendarConnectionStatus({
    checkingSession = false,
    sessionRestoreMessage = '',
    onCalendarAssigned,
    onConnectionCleared
}) {
    const sessionSnapshot = getGoogleSessionSnapshot()
    const connected = sessionSnapshot.active
    const expired = sessionSnapshot.expired
    const assigned = getAssignedCalendar()
    const email = getGoogleConnectedEmail()

    function handleDisconnect() {
        disconnectGoogleCalendar()

        if (typeof onConnectionCleared === 'function') {
            onConnectionCleared()
        }

        if (typeof onCalendarAssigned === 'function') {
            onCalendarAssigned(null)
        }
    }

    function getSessionLabel() {
        if (checkingSession) {
            return 'Restaurando...'
        }

        if (connected) {
            return 'Activa'
        }

        if (expired) {
            return 'Expirada'
        }

        if (sessionSnapshot.hasStoredContext) {
            return 'Inactiva'
        }

        return 'No conectada'
    }

    function getHelpText() {
        if (checkingSession) {
            return ''
        }

        if (connected) {
            return ''
        }

        if (expired && hasAssignedCalendar()) {
            return 'Tu calendario asignado sigue guardado. Solo necesitas reconectar Google.'
        }

        if (hasAssignedCalendar()) {
            return 'Tu calendario asignado sigue guardado localmente.'
        }

        return ''
    }

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #d7deea',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)'
            }}
        >
            <h3 style={{ marginTop: 0, marginBottom: '0.6rem', color: '#172033' }}>
                Estado del calendario
            </h3>

            <p style={{ margin: 0, color: '#5b6472', lineHeight: 1.65 }}>
                <strong>Sesión Google:</strong> {getSessionLabel()}
            </p>

            {email ? (
                <p style={{ margin: '0.35rem 0 0', color: '#5b6472', lineHeight: 1.65 }}>
                    <strong>Cuenta:</strong> {email}
                </p>
            ) : null}

            <p style={{ margin: '0.35rem 0 0', color: '#5b6472', lineHeight: 1.65 }}>
                <strong>Calendario asignado:</strong>{' '}
                {hasAssignedCalendar()
                    ? `${assigned?.summary || 'Sin nombre'} (${assigned?.id || ''})`
                    : 'Ninguno'}
            </p>

            {assigned?.timeZone ? (
                <p style={{ margin: '0.35rem 0 0', color: '#5b6472', lineHeight: 1.65 }}>
                    <strong>Zona horaria:</strong> {assigned.timeZone}
                </p>
            ) : null}

            {getHelpText() ? (
                <p
                    style={{
                        margin: '0.75rem 0 0',
                        color: '#92400e',
                        lineHeight: 1.65
                    }}
                >
                    {getHelpText()}
                </p>
            ) : null}

            {sessionRestoreMessage ? (
                <p
                    style={{
                        margin: '0.75rem 0 0',
                        color: connected ? '#166534' : '#92400e',
                        lineHeight: 1.65
                    }}
                >
                    {sessionRestoreMessage}
                </p>
            ) : null}

            <div
                style={{
                    marginTop: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                }}
            >
                <AssignCalendarButton
                    buttonText={
                        hasAssignedCalendar() ? 'Cambiar calendario' : 'Asignar calendario'
                    }
                    className="button-primary"
                    onCalendarAssigned={onCalendarAssigned}
                />

                {(connected || expired || hasAssignedCalendar()) && (
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={handleDisconnect}
                        disabled={checkingSession}
                    >
                        Limpiar conexión
                    </button>
                )}
            </div>
        </div>
    )
}