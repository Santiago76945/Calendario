// src/pages/Calendario.jsx

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CalendarList from '../components/CalendarList'
import EventForm from '../components/EventForm'
import * as calendarService from '../services/calendarService'
import '../styles/calendario.css'

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
            .then(data => {
                setEventos(data)
                setError(null)
            })
            .catch(err => {
                console.error(err)
                setError('No se pudieron cargar los eventos.')
            })
            .finally(() => {
                setCargando(false)
            })
    }, [])

    function handleGuardar(evento) {
        const indice = eventos.findIndex(e => e.id === evento.id)
        if (indice !== -1) {
            setEventos(prev => {
                const copia = [...prev]
                copia[indice] = evento
                return copia
            })
        } else {
            setEventos(prev => [...prev, evento])
        }
        setMostrarForm(false)
    }

    function handleEliminarLocal(id) {
        setEventos(prev => prev.filter(e => e.id !== id))
    }

    function handleEliminar(id) {
        calendarService
            .deleteEvento(id)
            .then(() => handleEliminarLocal(id))
            .catch(err => console.error(err))
    }

    return (
        <div className="calendario-container">
            <header className="calendario-header">
                <h2 className="calendario-title">Agenda de Eventos</h2>
            </header>

            <div className="crear-evento-wrapper">
                <button
                    className="btn-crear-evento"
                    onClick={() => {
                        setEventoEditar(null)
                        setMostrarForm(true)
                    }}
                >
                    Añadir evento
                </button>
                <Link to="/" className="btn-crear-evento" style={{ marginLeft: '0.5rem', textDecoration: 'none' }}>
                    Volver al menú
                </Link>
            </div>

            {cargando && <p className="calendario-loading">Cargando eventos...</p>}
            {error && <p className="calendario-error">{error}</p>}

            {!cargando && !error && (
                <div className="calendario-list">
                    <CalendarList
                        eventos={eventos}
                        onEditar={ev => {
                            setEventoEditar(ev)
                            setMostrarForm(true)
                        }}
                        onEliminar={handleEliminar}
                    />
                </div>
            )}

            {mostrarForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EventForm
                            evento={eventoEditar}
                            onCerrar={() => setMostrarForm(false)}
                            onGuardar={handleGuardar}
                            onEliminarLocal={handleEliminarLocal}
                        />
                        <button
                            className="modal-close-btn"
                            onClick={() => setMostrarForm(false)}
                            aria-label="Cerrar modal"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
