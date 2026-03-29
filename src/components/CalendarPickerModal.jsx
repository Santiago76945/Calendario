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

                <div className="calendar-picker-body">
                    <p className="calendar-picker-description">
                        Selecciona el calendario que la app usará para listar, crear, editar, eliminar, importar y exportar eventos.
                    </p>

                    {orderedCalendars.length === 0 ? (
                        <p className="error-text" style={{ marginBottom: 0 }}>
                            No se encontraron calendarios accesibles para esta cuenta.
                        </p>
                    ) : (
                        <div className="calendar-picker-list">
                            {orderedCalendars.map((calendar) => {
                                const checked = selectedId === calendar.id

                                return (
                                    <label
                                        key={calendar.id}
                                        className={`calendar-picker-item${checked ? ' calendar-picker-item-selected' : ''}`}
                                    >
                                        <div className="calendar-picker-radio-row">
                                            <input
                                                type="radio"
                                                name="calendar-select"
                                                checked={checked}
                                                onChange={() => setSelectedId(calendar.id)}
                                                className="calendar-picker-radio"
                                            />

                                            <div className="calendar-picker-content">
                                                <strong>{calendar.summary || calendar.id}</strong>

                                                {calendar.primary ? (
                                                    <span className="calendar-picker-primary">
                                                        Principal
                                                    </span>
                                                ) : null}

                                                <div className="calendar-picker-meta">
                                                    <div className="calendar-picker-meta-row">
                                                        <strong>ID:</strong> {calendar.id}
                                                    </div>
                                                    <div className="calendar-picker-meta-row">
                                                        <strong>Zona horaria:</strong> {calendar.timeZone || '-'}
                                                    </div>
                                                    <div className="calendar-picker-meta-row">
                                                        <strong>Permisos:</strong> {calendar.accessRole || '-'}
                                                    </div>
                                                    {calendar.description ? (
                                                        <div className="calendar-picker-meta-row">
                                                            <strong>Descripción:</strong> {calendar.description}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
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

                    <div className="calendar-picker-actions">
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