// src/components/IcsPreview.jsx

import React, { useState } from 'react'
import { createDraftSummary } from '../services/eventDraftService'
import { tryFormatHumanDateTime } from '../utils/dateTime'

export default function IcsPreview({
    icsContent,
    draft,
    isEditing,
    isSubmitting,
    submitError,
    onBackToEdit,
    onConfirm,
    onCancel
}) {
    const summary = createDraftSummary(draft || {})
    const [copyMessage, setCopyMessage] = useState('')

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(icsContent)
            setCopyMessage('Copiado.')
            window.setTimeout(() => setCopyMessage(''), 1500)
        } catch (error) {
            console.error('No se pudo copiar el ICS:', error)
            setCopyMessage('No se pudo copiar.')
            window.setTimeout(() => setCopyMessage(''), 1500)
        }
    }

    return (
        <div className="ics-preview">
            {submitError ? (
                <div className="error-text" style={{ marginBottom: '1rem', marginTop: 0 }}>
                    {submitError}
                </div>
            ) : null}

            <div className="ics-preview-layout">
                <section className="ics-preview-card">
                    <h4 style={{ marginTop: 0 }}>Resumen</h4>

                    <p><strong>Título:</strong> {summary.title}</p>
                    <p><strong>Inicio:</strong> {tryFormatHumanDateTime(summary.start, undefined, summary.timeZone)}</p>
                    <p><strong>Fin:</strong> {tryFormatHumanDateTime(summary.end, undefined, summary.timeZone)}</p>
                    <p><strong>Duración:</strong> {summary.durationMinutes} minutos</p>
                    <p><strong>Lugar:</strong> {summary.location}</p>
                    <p><strong>Zona horaria:</strong> {summary.timeZone}</p>

                    {draft?.description ? (
                        <p><strong>Descripción:</strong> {draft.description}</p>
                    ) : null}
                </section>

                <section className="ics-preview-code-card">
                    <div className="ics-preview-code-header">
                        <h4 className="ics-preview-code-title">Contenido del .ics</h4>

                        <div className="ics-preview-copy-area">
                            {copyMessage ? (
                                <span className="ics-preview-copy-message">
                                    {copyMessage}
                                </span>
                            ) : null}

                            <button
                                type="button"
                                className="button-secondary"
                                onClick={handleCopy}
                            >
                                Copiar
                            </button>
                        </div>
                    </div>

                    <pre className="ics-preview-pre">
                        {icsContent}
                    </pre>
                </section>
            </div>

            <div className="ics-preview-actions">
                <button type="button" className="button-secondary" onClick={onCancel}>
                    Cancelar
                </button>

                <button
                    type="button"
                    className="button-secondary"
                    onClick={onBackToEdit}
                >
                    Volver a editar
                </button>

                <button
                    type="button"
                    className="button-primary"
                    onClick={onConfirm}
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Guardando...'
                        : isEditing
                            ? 'Confirmar actualización'
                            : 'Confirmar creación'}
                </button>
            </div>
        </div>
    )
}