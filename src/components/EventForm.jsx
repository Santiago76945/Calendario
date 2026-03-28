// src/components/EventForm.jsx

import React, { useEffect, useMemo, useState } from 'react'
import AdvancedEventFields from './AdvancedEventFields'
import TimezoneField from './TimezoneField'
import {
    createInitialDraftState,
    createDraftFromEvent,
    buildDraftFromFormState,
    getDefaultDateInputValue,
    getDefaultTimeInputValue,
    combineDateAndTimeToLocalDateTime
} from '../services/eventDraftService'
import {
    getSavedTimezone,
    saveTimezonePreference
} from '../services/timezoneService'

export default function EventForm({ evento, onCerrar, onGeneratePreview }) {
    const savedTimezone = useMemo(() => getSavedTimezone(), [])
    const [advancedMode, setAdvancedMode] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const [form, setForm] = useState(() =>
        createInitialDraftState({
            timeZone: savedTimezone,
            defaultDate: getDefaultDateInputValue(),
            defaultStartTime: getDefaultTimeInputValue(),
            defaultDurationMinutes: 60
        })
    )

    useEffect(() => {
        if (evento) {
            setForm(createDraftFromEvent(evento, getSavedTimezone()))
            setAdvancedMode(true)
            setSubmitError('')
            return
        }

        setForm(
            createInitialDraftState({
                timeZone: getSavedTimezone(),
                defaultDate: getDefaultDateInputValue(),
                defaultStartTime: getDefaultTimeInputValue(),
                defaultDurationMinutes: 60
            })
        )
        setAdvancedMode(false)
        setSubmitError('')
    }, [evento])

    function updateField(name, value) {
        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    function handleTimezoneChange(nextTimezone) {
        saveTimezonePreference(nextTimezone)
        updateField('timeZone', nextTimezone)
    }

    function handleSubmit(e) {
        e.preventDefault()
        setSubmitError('')

        try {
            const startDateTime = combineDateAndTimeToLocalDateTime(form.date, form.time)

            const draft = buildDraftFromFormState({
                ...form,
                startDateTime
            })

            onGeneratePreview(draft)
        } catch (error) {
            console.error(error)
            setSubmitError(error.message || 'No se pudo generar la vista previa ICS.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="event-form">
            <div className="event-form-grid">
                <div className="event-form-field event-form-field-full">
                    <label htmlFor="summary">Nombre del evento</label>
                    <input
                        id="summary"
                        name="summary"
                        value={form.summary}
                        onChange={(e) => updateField('summary', e.target.value)}
                        placeholder="Ej: Baldur's Gate 3 con Dani"
                        required
                    />
                </div>

                <div className="event-form-field">
                    <label htmlFor="date">Fecha</label>
                    <input
                        id="date"
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        required
                    />
                </div>

                <div className="event-form-field">
                    <label htmlFor="time">Hora de inicio</label>
                    <input
                        id="time"
                        type="time"
                        name="time"
                        value={form.time}
                        onChange={(e) => updateField('time', e.target.value)}
                        required
                    />
                </div>

                <div className="event-form-field">
                    <label htmlFor="durationMinutes">Duración en minutos</label>
                    <input
                        id="durationMinutes"
                        type="number"
                        min="1"
                        step="1"
                        name="durationMinutes"
                        value={form.durationMinutes}
                        onChange={(e) => updateField('durationMinutes', e.target.value)}
                        required
                    />
                </div>

                <div className="event-form-field">
                    <label htmlFor="location">Lugar</label>
                    <input
                        id="location"
                        name="location"
                        value={form.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        placeholder="Ej: Online (Steam) o Dublin"
                    />
                </div>

                <div className="event-form-field event-form-field-full">
                    <TimezoneField
                        value={form.timeZone}
                        onChange={handleTimezoneChange}
                    />
                </div>
            </div>

            <div className="event-form-toggle-row">
                <button
                    type="button"
                    className="event-form-link-button"
                    onClick={() => setAdvancedMode((prev) => !prev)}
                >
                    {advancedMode ? 'Ocultar visión avanzada' : 'Mostrar visión avanzada'}
                </button>
            </div>

            {advancedMode && (
                <AdvancedEventFields
                    values={{
                        description: form.description,
                        uid: form.uid,
                        status: form.status,
                        productId: form.productId,
                        categories: form.categories,
                        notes: form.notes
                    }}
                    onChange={(name, value) => updateField(name, value)}
                />
            )}

            {submitError ? <p className="error-text">{submitError}</p> : null}

            <div className="event-form-actions">
                <button type="button" className="button-secondary" onClick={onCerrar}>
                    Cancelar
                </button>

                <button type="submit" className="button-primary">
                    Generar vista previa ICS
                </button>
            </div>
        </form>
    )
}