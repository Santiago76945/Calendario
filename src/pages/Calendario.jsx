// src/pages/Calendario.jsx
import React, { useEffect, useState } from 'react'
import CalendarList from '../components/CalendarList'
import EventForm from '../components/EventForm'
import * as calendarService from '../services/calendarService'

export default function Calendario() {
    const [eventos, setEventos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [eventoEditar, setEventoEditar] = useState(null)

    useEffect(() => {
        setCargando(true)
        calendarService
            .getEventos()
            .then((data) => {
                setEventos(data)
                setError(null)
            })
            .catch((err) => {
                console.error(err)
                setError('No se pudieron cargar los eventos.')
            })
            .finally(() => {
                setCargando(false)
            })
    }, [])

    const handleGuardar = (evento) => {
        const idx = eventos.findIndex((e) => e.id === evento.id)
        if (idx !== -1) {
            setEventos((prev) => {
                const copy = [...prev]
                copy[idx] = evento
                return copy
            })
        } else {
            setEventos((prev) => [...prev, evento])
        }
        setMostrarForm(false)
    }

    const handleEliminarLocal = (id) => {
        setEventos((prev) => prev.filter((e) => e.id !== id))
    }

    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Agenda de Eventos</h2>
                <div>
                    <button
                        className="mr-4 px-4 py-2 bg-blue-500 text-white rounded"
                        onClick={() => {
                            setEventoEditar(null)
                            setMostrarForm(true)
                        }}
                    >
                        Añadir evento
                    </button>
                </div>
            </header>

            {cargando && <p>Cargando eventos...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!cargando && !error && (
                <CalendarList
                    eventos={eventos}
                    onEditar={(ev) => {
                        setEventoEditar(ev)
                        setMostrarForm(true)
                    }}
                    onEliminar={(id) =>
                        calendarService
                            .deleteEvento(id)
                            .then(() => handleEliminarLocal(id))
                            .catch((err) => console.error(err))
                    }
                />
            )}

            {mostrarForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <EventForm
                            evento={eventoEditar}
                            onCerrar={() => setMostrarForm(false)}
                            onGuardar={(evt) => handleGuardar(evt)}
                            onEliminarLocal={handleEliminarLocal}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
