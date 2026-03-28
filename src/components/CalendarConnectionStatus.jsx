// src/components/CalendarConnectionStatus.jsx

import React from 'react'
import AssignCalendarButton from './AssignCalendarButton'
import {
    getAssignedCalendar,
    hasAssignedCalendar,
    isGoogleSessionActive,
    getGoogleConnectedEmail,
    clearFullCalendarConnection
} from '../services/calendarConfigStorageService'

export default function CalendarConnectionStatus({ onCalendarAssigned }) {
    const connected = isGoogleSessionActive()
    const assigned = getAssignedCalendar()
    const email = getGoogleConnectedEmail()

    function handleDisconnect() {
        clearFullCalendarConnection()

        if (typeof onCalendarAssigned === 'function') {
            onCalendarAssigned(null)
        }
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
                <strong>Sesión Google:</strong> {connected ? 'Activa' : 'No conectada'}
            </p>

            {email ? (
                <p style={{ margin: '0.35rem 0 0', color: '#5b6472', lineHeight: 1.65 }}>
                    <strong>Cuenta:</strong> {email}
                </p>
            ) : null}

            <p style={{ margin: '0.35rem 0 0', color: '#5b6472', lineHeight: 1.65 }}>
                <strong>Calendario asignado:</strong>{' '}
                {hasAssignedCalendar()
                    ? `${assigned.summary || 'Sin nombre'} (${assigned.id})`
                    : 'Ninguno'}
            </p>

            {assigned?.timeZone ? (
                <p style={{ margin: '0.35rem 0 0', color: '#5b6472', lineHeight: 1.65 }}>
                    <strong>Zona horaria:</strong> {assigned.timeZone}
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

                {(connected || hasAssignedCalendar()) && (
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={handleDisconnect}
                    >
                        Limpiar conexión
                    </button>
                )}
            </div>
        </div>
    )
}