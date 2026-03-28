// src/pages/Calendario.jsx

import React, { useEffect, useMemo, useState } from 'react'
import CalendarList from '../components/CalendarList'
import EventForm from '../components/EventForm'
import IcsPreview from '../components/IcsPreview'
import AiEventComposer from '../components/AiEventComposer'
import CalendarConnectionStatus from '../components/CalendarConnectionStatus'
import * as calendarService from '../services/calendarService'
import {
    createIcsFromDraft,
    buildDraftFromExistingEvent
} from '../services/icsService'
import {
    getAssignedCalendar,
    hasAssignedCalendar,
    isGoogleSessionActive
} from '../services/calendarConfigStorageService'
import '../styles/calendario.css'

const CREATION_MODES = {
    MANUAL: 'manual',
    AI: 'ai'
}

export default function Calendario() {
    const [eventos, setEventos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    const [mostrarModal, setMostrarModal] = useState(false)
    const [creationMode, setCreationMode] = useState(CREATION_MODES.MANUAL)

    const [eventoEditar, setEventoEditar] = useState(null)
    const [previewReadOnly, setPreviewReadOnly] = useState(false)
    const [draftActual, setDraftActual] = useState(null)
    const [icsPreview, setIcsPreview] = useState('')
    const [confirmando, setConfirmando] = useState(false)

    const [connectionRefreshKey, setConnectionRefreshKey] = useState(0)

    const sessionActive = isGoogleSessionActive()
    const assignedCalendar = getAssignedCalendar()
    const readyToUseCalendar = sessionActive && hasAssignedCalendar()

    useEffect(() => {
        if (!readyToUseCalendar) {
            setEventos([])
            setCargando(false)
            return
        }

        loadEventos()
    }, [connectionRefreshKey])

    async function loadEventos() {
        setCargando(true)

        try {
            const data = await calendarService.getEventos()
            setEventos(Array.isArray(data) ? data : [])
            setError(null)
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudieron cargar los eventos.')
        } finally {
            setCargando(false)
        }
    }

    function resetModalState() {
        setCreationMode(CREATION_MODES.MANUAL)
        setEventoEditar(null)
        setPreviewReadOnly(false)
        setDraftActual(null)
        setIcsPreview('')
        setConfirmando(false)
    }

    function abrirCrearManual() {
        if (!readyToUseCalendar) {
            setError('Primero debes asignar un calendario.')
            return
        }

        resetModalState()
        setCreationMode(CREATION_MODES.MANUAL)
        setMostrarModal(true)
    }

    function abrirCrearIA() {
        if (!readyToUseCalendar) {
            setError('Primero debes asignar un calendario.')
            return
        }

        resetModalState()
        setCreationMode(CREATION_MODES.AI)
        setMostrarModal(true)
    }

    function abrirEdicion(evento) {
        resetModalState()
        setCreationMode(CREATION_MODES.MANUAL)
        setEventoEditar(evento)
        setMostrarModal(true)
    }

    function cerrarModal() {
        setMostrarModal(false)
        resetModalState()
    }

    function handleGeneratePreview(draft) {
        try {
            const ics = createIcsFromDraft(draft)
            setDraftActual(draft)
            setIcsPreview(ics)
            setError(null)
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo generar la vista previa ICS.')
        }
    }

    async function handleConfirmarPreview() {
        if (!draftActual || !icsPreview || previewReadOnly) return

        setConfirmando(true)

        try {
            let resultado

            if (eventoEditar?.id) {
                resultado = await calendarService.updateEventoFromDraft(
                    eventoEditar.id,
                    draftActual,
                    icsPreview
                )

                setEventos((prev) =>
                    prev.map((ev) => (ev.id === resultado.id ? resultado : ev))
                )
            } else {
                resultado = await calendarService.createEventoFromDraft(
                    draftActual,
                    icsPreview
                )

                setEventos((prev) => [resultado, ...prev])
            }

            cerrarModal()
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo guardar el evento.')
        } finally {
            setConfirmando(false)
        }
    }

    async function handleEliminar(id) {
        try {
            await calendarService.deleteEvento(id)
            setEventos((prev) => prev.filter((ev) => ev.id !== id))
            setError(null)
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo eliminar el evento.')
        }
    }

    function handleVerIcs(evento) {
        try {
            const draft = buildDraftFromExistingEvent(evento)
            const ics = createIcsFromDraft(draft)

            setEventoEditar(evento)
            setDraftActual(draft)
            setIcsPreview(ics)
            setPreviewReadOnly(true)
            setCreationMode(CREATION_MODES.MANUAL)
            setMostrarModal(true)
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo construir la vista previa del ICS.')
        }
    }

    function handleBackFromPreview() {
        if (previewReadOnly) {
            cerrarModal()
            return
        }

        setIcsPreview('')
    }

    function handleCalendarAssigned() {
        setConnectionRefreshKey((prev) => prev + 1)
        setError(null)
    }

    const modalTitle = useMemo(() => {
        if (icsPreview) {
            if (previewReadOnly) {
                return 'Vista previa del ICS'
            }

            return eventoEditar ? 'Vista previa ICS de edición' : 'Vista previa ICS'
        }

        if (creationMode === CREATION_MODES.AI) {
            return 'Crear evento con IA'
        }

        return eventoEditar ? 'Editar evento' : 'Crear evento manual'
    }, [creationMode, eventoEditar, icsPreview, previewReadOnly])

    return (
        <div className="calendario-container">
            <header className="calendario-header">
                <div>
                    <h2 className="calendario-title">Agenda de eventos</h2>
                    <p className="calendario-subtitle">
                        Todos los eventos se revisan primero como archivo .ics antes de confirmar.
                    </p>
                    {assignedCalendar?.summary ? (
                        <p className="calendario-subtitle" style={{ marginTop: '0.5rem' }}>
                            Calendario activo: <strong>{assignedCalendar.summary}</strong>
                        </p>
                    ) : null}
                </div>

                <div className="calendario-actions">
                    <button type="button" onClick={abrirCrearManual}>
                        Nuevo evento manual
                    </button>
                    <button
                        type="button"
                        className="calendario-secondary-button"
                        onClick={abrirCrearIA}
                    >
                        Crear con IA
                    </button>
                </div>
            </header>

            <div style={{ marginBottom: '1.5rem' }}>
                <CalendarConnectionStatus onCalendarAssigned={handleCalendarAssigned} />
            </div>

            {!readyToUseCalendar ? (
                <div className="calendar-empty-state">
                    Primero conecta Google y asigna un calendario para empezar a trabajar.
                </div>
            ) : (
                <>
                    {cargando && <p className="calendario-loading">Cargando eventos...</p>}
                    {error && <p className="calendario-error">{error}</p>}

                    {!cargando && (
                        <div className="calendario-list">
                            <CalendarList
                                eventos={eventos}
                                onEditar={abrirEdicion}
                                onEliminar={handleEliminar}
                                onVerIcs={handleVerIcs}
                            />
                        </div>
                    )}
                </>
            )}

            {mostrarModal && readyToUseCalendar && (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-wide">
                        <div className="modal-header">
                            <h3 className="modal-title">{modalTitle}</h3>
                            <button
                                className="modal-close-btn"
                                onClick={cerrarModal}
                                aria-label="Cerrar modal"
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        {!icsPreview && creationMode === CREATION_MODES.MANUAL && (
                            <EventForm
                                evento={eventoEditar}
                                onCerrar={cerrarModal}
                                onGeneratePreview={handleGeneratePreview}
                            />
                        )}

                        {!icsPreview && creationMode === CREATION_MODES.AI && (
                            <AiEventComposer
                                onCerrar={cerrarModal}
                                onGeneratePreview={handleGeneratePreview}
                            />
                        )}

                        {icsPreview && (
                            <IcsPreview
                                icsContent={icsPreview}
                                draft={draftActual}
                                isEditing={Boolean(eventoEditar) && !previewReadOnly}
                                isSubmitting={confirmando}
                                onBackToEdit={handleBackFromPreview}
                                onConfirm={handleConfirmarPreview}
                                onCancel={cerrarModal}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}