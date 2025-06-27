// src/components/CalendarList.jsx
import React from 'react'

export default function CalendarList({ eventos, onEditar, onEliminar }) {
    if (!Array.isArray(eventos) || eventos.length === 0) {
        return <p className="text-gray-500">No hay eventos próximos.</p>
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
        <ul className="space-y-4">
            {eventos.map(ev => {
                const colorInfo = colorMap[ev.colorId] || { label: 'Default', hex: '#ffffff' }
                const overrides = ev.reminders?.overrides || []

                return (
                    <li
                        key={ev.id}
                        className="bg-white rounded-lg shadow p-4 flex justify-between items-start"
                    >
                        <div>
                            <h3 className="text-lg font-semibold mb-1">{ev.summary}</h3>
                            <p className="text-gray-600 mb-1">
                                {new Date(ev.start.dateTime).toLocaleString()} –{' '}
                                {new Date(ev.end.dateTime).toLocaleString()}
                            </p>
                            {ev.location && (
                                <p className="text-gray-600 mb-1">Lugar: {ev.location}</p>
                            )}
                            <p className="text-gray-600 mb-2">
                                Color: <span className="font-medium">{colorInfo.label}</span>
                            </p>

                            {overrides.length > 0 ? (
                                <div>
                                    <p className="text-gray-600 font-medium">Recordatorios:</p>
                                    <ul className="list-disc ml-5 text-gray-600">
                                        {overrides.map((r, i) => (
                                            <li key={i}>
                                                {formatMinutes(r.minutes)} antes ({r.method})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-gray-600">Sin recordatorios configurados</p>
                            )}
                        </div>

                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={() => onEditar(ev)}
                                className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => onEliminar(ev.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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
