// src/components/CalendarPickerModal.jsx

import React, { useMemo, useState } from 'react'
import { assignCalendar } from '../services/googleCalendarConnectionService'

function sortCalendars(items) {
    return [...items].sort((a, b) => {
        if (a.primary && !b.primary) return -1
        if (!a.primary && b.primary) return 1
        return String(a.summary || '').localeCompare(String(b.summary || ''))
    })
}

export default function CalendarPickerModal({
    calendars,
    onClose,
    onAssigned
}) {
    const orderedCalendars = useMemo(
        () => sortCalendars(Array.isArray(calendars) ? calendars : []),
        [calendars]
    )

    const [selectedId, setSelectedId] = useState(
        orderedCalendars[0]?.id || ''
    )
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    function handleConfirm() {
        if (!selectedId) {
            setError('Debes seleccionar un calendario.')
            return
        }

        const calendar = orderedCalendars.find((item) => item.id === selectedId)

        if (!calendar) {
            setError('No se encontró el calendario seleccionado.')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            assignCalendar(calendar)

            if (typeof onAssigned === 'function') {
                onAssigned(calendar)
            }
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo asignar el calendario.')
            setSubmitting(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-content-wide">
                <div className="modal-header">
                    <h3 className="modal-title">Asignar calendario</h3>

                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <p style={{ marginTop: 0, color: '#5b6472' }}>
                        Selecciona el calendario que la app usará para listar, crear, editar, eliminar, importar y exportar eventos.
                    </p>

                    {orderedCalendars.length === 0 ? (
                        <p className="error-text" style={{ marginBottom: 0 }}>
                            No se encontraron calendarios accesibles para esta cuenta.
                        </p>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gap: '0.75rem',
                                maxHeight: '420px',
                                overflow: 'auto'
                            }}
                        >
                            {orderedCalendars.map((calendar) => {
                                const checked = selectedId === calendar.id

                                return (
                                    <label
                                        key={calendar.id}
                                        style={{
                                            display: 'block',
                                            border: checked
                                                ? '1px solid #2563eb'
                                                : '1px solid #d7deea',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            background: checked ? '#eef2ff' : '#fff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="calendar-select"
                                            checked={checked}
                                            onChange={() => setSelectedId(calendar.id)}
                                            style={{ marginRight: '0.5rem', width: 'auto' }}
                                        />

                                        <strong>{calendar.summary || calendar.id}</strong>

                                        {calendar.primary ? (
                                            <span style={{ marginLeft: '0.5rem', color: '#2563eb' }}>
                                                Principal
                                            </span>
                                        ) : null}

                                        <div style={{ marginTop: '0.5rem', color: '#5b6472' }}>
                                            <div><strong>ID:</strong> {calendar.id}</div>
                                            <div><strong>Zona horaria:</strong> {calendar.timeZone || '-'}</div>
                                            <div><strong>Permisos:</strong> {calendar.accessRole || '-'}</div>
                                            {calendar.description ? (
                                                <div style={{ marginTop: '0.35rem' }}>
                                                    <strong>Descripción:</strong> {calendar.description}
                                                </div>
                                            ) : null}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}

                    {error ? (
                        <p className="error-text" style={{ marginBottom: 0 }}>
                            {error}
                        </p>
                    ) : null}

                    <div
                        style={{
                            marginTop: '1.25rem',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            flexWrap: 'wrap'
                        }}
                    >
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="button-primary"
                            onClick={handleConfirm}
                            disabled={submitting || orderedCalendars.length === 0}
                        >
                            {submitting ? 'Guardando...' : 'Usar este calendario'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}