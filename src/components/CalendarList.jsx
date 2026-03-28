// src/components/CalendarList.jsx

import React from 'react'

function formatDateTime(value) {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString()
}

function getStartValue(ev) {
    return ev?.start?.dateTime || ev?.start?.date || ev?.start || ''
}

function getEndValue(ev) {
    return ev?.end?.dateTime || ev?.end?.date || ev?.end || ''
}

export default function CalendarList({ eventos, onEditar, onEliminar, onVerIcs }) {
    if (!Array.isArray(eventos) || eventos.length === 0) {
        return <p className="calendar-empty-state">No hay eventos próximos.</p>
    }

    return (
        <ul className="calendar-list">
            {eventos.map((ev) => (
                <li key={ev.id} className="calendar-card">
                    <div className="calendar-card-body">
                        <h3 className="calendar-card-title">{ev.summary || 'Sin título'}</h3>

                        <p className="calendar-card-time">
                            {formatDateTime(getStartValue(ev))} - {formatDateTime(getEndValue(ev))}
                        </p>

                        {ev.location ? (
                            <p className="calendar-card-meta">
                                <strong>Lugar:</strong> {ev.location}
                            </p>
                        ) : null}

                        {ev.description ? (
                            <p className="calendar-card-meta">
                                <strong>Descripción:</strong> {ev.description}
                            </p>
                        ) : null}

                        {(ev.timeZone || ev.start?.timeZone || ev.end?.timeZone) ? (
                            <p className="calendar-card-meta">
                                <strong>Zona horaria:</strong>{' '}
                                {ev.timeZone || ev.start?.timeZone || ev.end?.timeZone}
                            </p>
                        ) : null}
                    </div>

                    <div className="calendar-card-actions">
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => onVerIcs(ev)}
                        >
                            Ver ICS
                        </button>

                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => onEditar(ev)}
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            className="button-danger"
                            onClick={() => onEliminar(ev.id)}
                        >
                            Eliminar
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    )
}