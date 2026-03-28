// src/components/IcsPreview.jsx

import React, { useState } from 'react'
import { createDraftSummary } from '../services/eventDraftService'
import { tryFormatHumanDateTime } from '../utils/dateTime'

export default function IcsPreview({
    icsContent,
    draft,
    isEditing,
    isSubmitting,
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
        <div style={{ padding: '1.5rem' }}>
            <div
                style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.3fr)'
                }}
            >
                <section
                    style={{
                        border: '1px solid #d7deea',
                        borderRadius: '12px',
                        padding: '1rem',
                        background: '#fff'
                    }}
                >
                    <h4 style={{ marginTop: 0 }}>Resumen</h4>

                    <p><strong>Título:</strong> {summary.title}</p>
                    <p><strong>Inicio:</strong> {tryFormatHumanDateTime(summary.start)}</p>
                    <p><strong>Fin:</strong> {tryFormatHumanDateTime(summary.end)}</p>
                    <p><strong>Duración:</strong> {summary.durationMinutes} minutos</p>
                    <p><strong>Lugar:</strong> {summary.location}</p>
                    <p><strong>Zona horaria:</strong> {summary.timeZone}</p>

                    {draft?.description ? (
                        <p><strong>Descripción:</strong> {draft.description}</p>
                    ) : null}
                </section>

                <section
                    style={{
                        border: '1px solid #d7deea',
                        borderRadius: '12px',
                        padding: '1rem',
                        background: '#0f172a',
                        color: '#e2e8f0'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '0.75rem'
                        }}
                    >
                        <h4 style={{ margin: 0, color: '#fff' }}>Contenido del .ics</h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {copyMessage ? (
                                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
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

                    <pre
                        style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.92rem',
                            lineHeight: 1.6,
                            fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                        }}
                    >
                        {icsContent}
                    </pre>
                </section>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '1.5rem',
                    flexWrap: 'wrap'
                }}
            >
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