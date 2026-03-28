// src/pages/ImportExport.jsx

import React, { useMemo, useState } from 'react'
import * as calendarService from '../services/calendarService'
import { validateIcsContent } from '../services/icsService'
import CalendarConnectionStatus from '../components/CalendarConnectionStatus'
import {
    getAssignedCalendar,
    hasAssignedCalendar,
    isGoogleSessionActive
} from '../services/calendarConfigStorageService'
import '../styles/importexport.css'

export default function ImportExport() {
    const [icsInput, setIcsInput] = useState('')
    const [errorParseo, setErrorParseo] = useState(null)
    const [resultado, setResultado] = useState(null)
    const [importando, setImportando] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const readyToUseCalendar = isGoogleSessionActive() && hasAssignedCalendar()
    const assignedCalendar = getAssignedCalendar()

    const validation = useMemo(() => {
        if (!icsInput.trim()) {
            return null
        }

        return validateIcsContent(icsInput)
    }, [icsInput])

    async function handleImportar() {
        setErrorParseo(null)
        setResultado(null)

        if (!readyToUseCalendar) {
            setErrorParseo('Primero debes asignar un calendario.')
            return
        }

        if (!icsInput.trim()) {
            setErrorParseo('Debes pegar contenido ICS antes de importar.')
            return
        }

        const check = validateIcsContent(icsInput)
        if (!check.ok) {
            setErrorParseo(check.error)
            return
        }

        setImportando(true)

        try {
            const response = await calendarService.importIcs(icsInput)
            setResultado({
                ok: true,
                message: response?.message || 'Archivo ICS importado correctamente.'
            })
        } catch (err) {
            console.error(err)
            setResultado(null)
            setErrorParseo(err.message || 'No se pudo importar el archivo ICS.')
        } finally {
            setImportando(false)
        }
    }

    async function handleExportarTodos() {
        setErrorParseo(null)

        if (!readyToUseCalendar) {
            setErrorParseo('Primero debes asignar un calendario.')
            return
        }

        try {
            await calendarService.downloadAllEventosIcs()
        } catch (err) {
            console.error(err)
            setErrorParseo(err.message || 'No se pudo exportar el calendario.')
        }
    }

    function handleCalendarAssigned() {
        setRefreshKey((prev) => prev + 1)
        setErrorParseo(null)
        setResultado(null)
    }

    return (
        <div className="importexport-container">
            <header className="importexport-header">
                <div>
                    <h2 className="importexport-title">Importar / Exportar eventos ICS</h2>
                    <p className="importexport-subtitle">
                        El formato principal de la app ahora es .ics.
                    </p>
                    {assignedCalendar?.summary ? (
                        <p className="importexport-subtitle" style={{ marginTop: '0.5rem' }}>
                            Calendario activo: <strong>{assignedCalendar.summary}</strong>
                        </p>
                    ) : null}
                </div>

                <button
                    type="button"
                    className="importexport-secondary-button"
                    onClick={handleExportarTodos}
                >
                    Exportar todos los eventos
                </button>
            </header>

            <div style={{ marginBottom: '1.5rem' }}>
                <CalendarConnectionStatus
                    key={refreshKey}
                    onCalendarAssigned={handleCalendarAssigned}
                />
            </div>

            {!readyToUseCalendar ? (
                <section className="importexport-panel">
                    <p className="error-text" style={{ margin: 0 }}>
                        Primero conecta Google y asigna un calendario para importar o exportar.
                    </p>
                </section>
            ) : (
                <section className="importexport-panel">
                    <label className="importexport-label" htmlFor="ics-input">
                        Pega aquí el contenido del archivo .ics
                    </label>

                    <textarea
                        id="ics-input"
                        className="importexport-textarea"
                        placeholder="BEGIN:VCALENDAR..."
                        value={icsInput}
                        onChange={(e) => setIcsInput(e.target.value)}
                        spellCheck={false}
                    />

                    {validation && (
                        <div
                            className={
                                validation.ok
                                    ? 'importexport-validation importexport-validation-ok'
                                    : 'importexport-validation importexport-validation-error'
                            }
                        >
                            {validation.ok
                                ? 'El contenido ICS parece válido.'
                                : `Problema detectado: ${validation.error}`}
                        </div>
                    )}

                    {errorParseo && <p className="error-text">{errorParseo}</p>}

                    <div className="importexport-actions">
                        <button
                            type="button"
                            className="importexport-button"
                            disabled={importando}
                            onClick={handleImportar}
                        >
                            {importando ? 'Importando...' : 'Importar ICS'}
                        </button>
                    </div>

                    {resultado && (
                        <div className="importexport-result">
                            <strong>Resultado:</strong>
                            <p>{resultado.message}</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}