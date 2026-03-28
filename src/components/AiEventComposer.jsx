// src/components/AiEventComposer.jsx

import React, { useMemo, useState } from 'react'
import TimezoneField from './TimezoneField'
import { requestAiEventStep } from '../services/aiEventService'
import { buildSimpleDraftFromAiPayload } from '../services/eventDraftService'
import {
    getAiDraftTimezone,
    saveAiDraftTimezone,
    saveTimezonePreference
} from '../services/timezoneService'

export default function AiEventComposer({ onCerrar, onGeneratePreview }) {
    const initialTimezone = useMemo(() => getAiDraftTimezone(), [])
    const [timeZone, setTimeZone] = useState(initialTimezone)
    const [message, setMessage] = useState('')
    const [conversation, setConversation] = useState([])
    const [assistantMessage, setAssistantMessage] = useState(
        'Describe el evento con la mayor cantidad de detalles posibles.'
    )
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function handleTimezoneChange(nextTimezone) {
        setTimeZone(nextTimezone)
        saveAiDraftTimezone(nextTimezone)
        saveTimezonePreference(nextTimezone)
    }

    async function handleSubmit(e) {
        e.preventDefault()

        const trimmed = message.trim()
        if (!trimmed) return

        setLoading(true)
        setError('')

        const nextConversation = [
            ...conversation,
            { role: 'user', content: trimmed }
        ]

        try {
            const result = await requestAiEventStep({
                message: trimmed,
                timeZone,
                conversation
            })

            const resolvedAssistantMessage =
                result.assistantMessage ||
                (result.status === 'ready'
                    ? 'Ya tengo toda la información para generar el evento.'
                    : 'Necesito un poco más de información.')

            const updatedConversation = [
                ...nextConversation,
                {
                    role: 'assistant',
                    content: resolvedAssistantMessage
                }
            ]

            setConversation(updatedConversation)
            setAssistantMessage(resolvedAssistantMessage)
            setMessage('')

            if (result.status === 'ready' && result.draft) {
                const draft = buildSimpleDraftFromAiPayload({
                    ...result.draft,
                    timeZone: result.draft.timeZone || timeZone
                })

                onGeneratePreview(draft)
            }
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo procesar el mensaje con IA.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <TimezoneField value={timeZone} onChange={handleTimezoneChange} />
            </div>

            <div
                style={{
                    border: '1px solid #d7deea',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: '#f8fafc',
                    marginBottom: '1rem'
                }}
            >
                <strong>Asistente:</strong>
                <p style={{ marginBottom: 0, marginTop: '0.5rem', color: '#334155' }}>
                    {assistantMessage}
                </p>
            </div>

            {conversation.length > 0 && (
                <div
                    style={{
                        border: '1px solid #d7deea',
                        borderRadius: '12px',
                        background: '#fff',
                        padding: '1rem',
                        marginBottom: '1rem',
                        maxHeight: '280px',
                        overflow: 'auto'
                    }}
                >
                    {conversation.map((item, index) => (
                        <div
                            key={`${item.role}-${index}`}
                            style={{
                                marginBottom: '0.9rem',
                                paddingBottom: '0.9rem',
                                borderBottom:
                                    index === conversation.length - 1
                                        ? 'none'
                                        : '1px solid #eef2f7'
                            }}
                        >
                            <strong>
                                {item.role === 'user' ? 'Tú' : 'Asistente'}
                            </strong>
                            <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap' }}>
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <label htmlFor="ai-event-message">Mensaje</label>
                <textarea
                    id="ai-event-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Ej: El jueves 10 de abril a las 19:30 quiero jugar Baldur's Gate 3 con Dani durante 90 minutos por Steam."
                />

                {error ? (
                    <p className="error-text" style={{ marginBottom: 0 }}>
                        {error}
                    </p>
                ) : null}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        marginTop: '1rem',
                        flexWrap: 'wrap'
                    }}
                >
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={onCerrar}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="button-primary"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Enviar'}
                    </button>
                </div>
            </form>
        </div>
    )
}