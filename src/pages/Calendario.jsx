// src/pages/Calendario.jsx

import React, { useEffect, useMemo, useState } from 'react'
import CalendarList from '../components/CalendarList'
import CalendarPagination from '../components/CalendarPagination'
import EventForm from '../components/EventForm'
import IcsPreview from '../components/IcsPreview'
import AiEventComposer from '../components/AiEventComposer'
import CalendarConnectionStatus from '../components/CalendarConnectionStatus'
import BackButton from '../components/BackButton'
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
import { bootstrapGoogleCalendarSession } from '../services/googleSessionBootstrapService'
import '../styles/calendario.css'

const CREATION_MODES = {
    MANUAL: 'manual',
    AI: 'ai'
}

const DEFAULT_PAGE_SIZE = 10

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
    const [modalError, setModalError] = useState('')

    const [connectionRefreshKey, setConnectionRefreshKey] = useState(0)
    const [checkingSession, setCheckingSession] = useState(true)
    const [sessionRestoreMessage, setSessionRestoreMessage] = useState('')

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(DEFAULT_PAGE_SIZE)
    const [pageTokensByPage, setPageTokensByPage] = useState({ 1: '' })
    const [hasNextPage, setHasNextPage] = useState(false)
    const [totalKnownPages, setTotalKnownPages] = useState(1)

    const sessionActive = isGoogleSessionActive()
    const assignedCalendar = getAssignedCalendar()
    const hasCalendarAssigned = hasAssignedCalendar()
    const readyToUseCalendar =
        !checkingSession && sessionActive && hasCalendarAssigned

    useEffect(() => {
        let cancelled = false

        async function restoreGoogleSession() {
            setCheckingSession(true)
            setSessionRestoreMessage('')

            try {
                const result = await bootstrapGoogleCalendarSession()

                if (cancelled) {
                    return
                }

                setSessionRestoreMessage(String(result?.message || '').trim())
            } catch (err) {
                if (cancelled) {
                    return
                }

                console.error(err)
                setSessionRestoreMessage(
                    err.message || 'No se pudo verificar la sesión de Google.'
                )
            } finally {
                if (!cancelled) {
                    setCheckingSession(false)
                }
            }
        }

        restoreGoogleSession()

        return () => {
            cancelled = true
        }
    }, [connectionRefreshKey])

    useEffect(() => {
        if (checkingSession) {
            setCargando(true)
            return
        }

        if (!readyToUseCalendar) {
            setEventos([])
            setCurrentPage(1)
            setPageTokensByPage({ 1: '' })
            setHasNextPage(false)
            setTotalKnownPages(1)
            setCargando(false)
            return
        }

        resetPaginationState()
        loadEventos(1, {
            pageTokenOverride: '',
            replaceKnownTokens: true
        })
    }, [checkingSession, readyToUseCalendar])

    function resetPaginationState() {
        setCurrentPage(1)
        setPageTokensByPage({ 1: '' })
        setHasNextPage(false)
        setTotalKnownPages(1)
    }

    function getCalendarBlockedMessage() {
        if (checkingSession) {
            return 'Restaurando sesión de Google...'
        }

        if (!sessionActive && hasCalendarAssigned) {
            return 'La sesión de Google no está activa. Debes reconectar Google para usar el calendario asignado.'
        }

        if (!sessionActive) {
            return 'Primero debes conectar Google.'
        }

        if (!hasCalendarAssigned) {
            return 'Primero debes asignar un calendario.'
        }

        return 'Primero debes conectar Google y asignar un calendario.'
    }

    async function loadEventos(
        targetPage = 1,
        options = {}
    ) {
        const {
            pageTokenOverride,
            replaceKnownTokens = false
        } = options

        const safeTargetPage = Math.max(1, Number(targetPage) || 1)

        const pageToken =
            typeof pageTokenOverride === 'string'
                ? pageTokenOverride
                : pageTokensByPage[safeTargetPage]

        if (pageToken === undefined) {
            setError('No se puede abrir esa página todavía.')
            return
        }

        setCargando(true)

        try {
            const data = await calendarService.getEventos({
                pageToken,
                pageSize
            })

            const items = Array.isArray(data?.items) ? data.items : []
            const nextPageToken = String(data?.nextPageToken || '')
            const nextPageExists = Boolean(nextPageToken)

            setEventos(items)
            setCurrentPage(safeTargetPage)
            setHasNextPage(nextPageExists)
            setError(null)

            setPageTokensByPage((prev) => {
                const baseTokens = replaceKnownTokens ? { 1: '' } : { ...prev }

                baseTokens[safeTargetPage] = pageToken

                if (nextPageExists) {
                    baseTokens[safeTargetPage + 1] = nextPageToken
                } else {
                    delete baseTokens[safeTargetPage + 1]
                }

                return baseTokens
            })

            setTotalKnownPages((prev) => {
                if (nextPageExists) {
                    return Math.max(prev, safeTargetPage + 1)
                }

                return Math.max(
                    1,
                    Math.min(prev, safeTargetPage)
                )
            })
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
        setModalError('')
    }

    function abrirCrearManual() {
        if (!readyToUseCalendar) {
            setError(getCalendarBlockedMessage())
            return
        }

        resetModalState()
        setCreationMode(CREATION_MODES.MANUAL)
        setMostrarModal(true)
    }

    function abrirCrearIA() {
        if (!readyToUseCalendar) {
            setError(getCalendarBlockedMessage())
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
            setModalError('')
            setError(null)
        } catch (err) {
            console.error(err)
            setModalError(err.message || 'No se pudo generar la vista previa ICS.')
        }
    }

    async function handleConfirmarPreview() {
        if (!draftActual || !icsPreview || previewReadOnly) return

        setConfirmando(true)
        setModalError('')

        try {
            if (eventoEditar?.id) {
                await calendarService.updateEventoFromDraft(
                    eventoEditar.id,
                    draftActual,
                    icsPreview
                )
            } else {
                await calendarService.createEventoFromDraft(
                    draftActual,
                    icsPreview
                )
            }

            setError(null)
            cerrarModal()

            const pageToken = pageTokensByPage[currentPage] ?? ''
            await loadEventos(currentPage, { pageTokenOverride: pageToken })
        } catch (err) {
            console.error(err)
            setModalError(err.message || 'No se pudo guardar el evento.')
        } finally {
            setConfirmando(false)
        }
    }

    async function handleEliminar(id) {
        try {
            await calendarService.deleteEvento(id)
            setError(null)

            const shouldGoToPreviousPage =
                eventos.length === 1 && currentPage > 1

            const targetPage = shouldGoToPreviousPage ? currentPage - 1 : currentPage
            const pageToken = pageTokensByPage[targetPage] ?? ''

            await loadEventos(targetPage, { pageTokenOverride: pageToken })
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
            setModalError('')
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
        setModalError('')
    }

    function handleCalendarAssigned() {
        setConnectionRefreshKey((prev) => prev + 1)
        setError(null)
    }

    function handleConnectionCleared() {
        setConnectionRefreshKey((prev) => prev + 1)
        setError(null)
    }

    async function handlePageSelect(page) {
        if (cargando || page === currentPage) {
            return
        }

        const targetToken = pageTokensByPage[page]

        if (targetToken === undefined) {
            return
        }

        await loadEventos(page, { pageTokenOverride: targetToken })
    }

    async function handlePrevPage() {
        if (cargando || currentPage <= 1) {
            return
        }

        const targetPage = currentPage - 1
        const targetToken = pageTokensByPage[targetPage]

        if (targetToken === undefined) {
            return
        }

        await loadEventos(targetPage, { pageTokenOverride: targetToken })
    }

    async function handleNextPage() {
        if (cargando || !hasNextPage) {
            return
        }

        const targetPage = currentPage + 1
        const targetToken = pageTokensByPage[targetPage]

        if (targetToken === undefined) {
            return
        }

        await loadEventos(targetPage, { pageTokenOverride: targetToken })
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
            <BackButton />

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
                    <button
                        type="button"
                        onClick={abrirCrearManual}
                        disabled={!readyToUseCalendar}
                        title={!readyToUseCalendar ? getCalendarBlockedMessage() : undefined}
                    >
                        Nuevo evento manual
                    </button>
                    <button
                        type="button"
                        className="calendario-secondary-button"
                        onClick={abrirCrearIA}
                        disabled={!readyToUseCalendar}
                        title={!readyToUseCalendar ? getCalendarBlockedMessage() : undefined}
                    >
                        Crear con IA
                    </button>
                </div>
            </header>

            <div style={{ marginBottom: '1.5rem' }}>
                <CalendarConnectionStatus
                    checkingSession={checkingSession}
                    sessionRestoreMessage={sessionRestoreMessage}
                    onCalendarAssigned={handleCalendarAssigned}
                    onConnectionCleared={handleConnectionCleared}
                />
            </div>

            {error && <p className="calendario-error">{error}</p>}

            {!readyToUseCalendar ? (
                <div className="calendar-empty-state">
                    {getCalendarBlockedMessage()}
                </div>
            ) : (
                <>
                    {cargando && <p className="calendario-loading">Cargando eventos...</p>}

                    {!cargando && (
                        <>
                            <div className="calendario-list">
                                <CalendarList
                                    eventos={eventos}
                                    onEditar={abrirEdicion}
                                    onEliminar={handleEliminar}
                                    onVerIcs={handleVerIcs}
                                />
                            </div>

                            <CalendarPagination
                                currentPage={currentPage}
                                totalKnownPages={totalKnownPages}
                                hasNextPage={hasNextPage}
                                disabled={cargando}
                                onPageSelect={handlePageSelect}
                                onPrev={handlePrevPage}
                                onNext={handleNextPage}
                            />
                        </>
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
                                submitError={modalError}
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