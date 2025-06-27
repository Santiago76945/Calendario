// src/components/CalendarList.jsx

import React from 'react'

export default function CalendarList({ eventos, onEditar, onEliminar }) {
    if (!Array.isArray(eventos) || eventos.length === 0) {
        return <p className="calendario-loading">No hay eventos próximos.</p>
    }

    const colorMap = {
        '1': { label: 'Lavender', hex: '#a4bdfc' },
        '2': { label: 'Sage', hex: '#7ae7bf' },
        '3': { label: 'Grape', hex: '#dbadff' },
        '4': { label: 'Flamingo', hex: '#ff887c' },
        '5': { label: 'Banana', hex: '#fbd75b' },
        '6': { label: 'Tangerine', hex: '#ffb878' },
        '7': { label: 'Peacock', hex: '#46d6db' },
        '8': { label: 'Graphite', hex: '#e1e1e1' },
        '9': { label: 'Blueberry', hex: '#5484ed' },
        '10': { label: 'Basil', hex: '#51b749' },
        '11': { label: 'Tomato', hex: '#dc2127' }
    }

    function formatMinutes(minutosTotal) {
        const dias = Math.floor(minutosTotal / 1440)
        const resto = minutosTotal % 1440
        const horas = Math.floor(resto / 60)
        const minutos = resto % 60

        const partes = []
        if (dias) partes.push(dias === 1 ? '1 día' : `${dias} días`)
        if (horas) partes.push(horas === 1 ? '1 hora' : `${horas} horas`)
        if (minutos) partes.push(minutos === 1 ? '1 minuto' : `${minutos} minutos`)
        if (partes.length === 0) partes.push('0 minutos')
        return partes.join(' ')
    }

    return (
        <ul className="calendario-list">
            {eventos.map(ev => {
                const colorInfo = colorMap[ev.colorId] || { label: 'Default', hex: '#ffffff' }
                const overrides = ev.reminders?.overrides || []

                return (
                    <li key={ev.id} className="event-card">
                        <div className="event-info">
                            <h3 className="event-title">{ev.summary}</h3>
                            <p className="event-time">
                                {new Date(ev.start.dateTime).toLocaleString()} –{' '}
                                {new Date(ev.end.dateTime).toLocaleString()}
                            </p>
                            {ev.location && (
                                <p className="event-location">Lugar: {ev.location}</p>
                            )}
                            <p className="event-color">
                                Color: <span className="event-color-label">{colorInfo.label}</span>
                            </p>

                            {overrides.length > 0 ? (
                                <div className="event-reminders">
                                    <p className="reminders-label">Recordatorios:</p>
                                    <ul className="reminders-list">
                                        {overrides.map((r, i) => (
                                            <li key={i} className="reminder-item">
                                                {formatMinutes(r.minutes)} antes ({r.method})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="no-reminders">Sin recordatorios configurados</p>
                            )}
                        </div>

                        <div className="event-actions">
                            <button
                                className="btn-editar"
                                onClick={() => onEditar(ev)}
                            >
                                Editar
                            </button>
                            <button
                                className="btn-eliminar"
                                onClick={() => onEliminar(ev.id)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
