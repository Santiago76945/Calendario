// src/components/EventForm.jsx

import React, { useState, useEffect } from 'react'
import * as calendarService from '../services/calendarService'
import '../styles/calendario.css' // asume aquí están definidas las clases de formulario

export default function EventForm({ evento, onCerrar, onGuardar, onEliminarLocal }) {
    const colorOptions = [
        { id: '10', label: 'Basil (Verde)' },
        { id: '5', label: 'Banana (Amarillo)' },
        { id: '11', label: 'Tomato (Rojo)' },
        { id: '1', label: 'Lavender' },
        { id: '2', label: 'Sage' },
        { id: '3', label: 'Grape' },
        { id: '4', label: 'Flamingo' },
        { id: '6', label: 'Tangerine' },
        { id: '7', label: 'Peacock' },
        { id: '8', label: 'Graphite' },
        { id: '9', label: 'Blueberry' }
    ]

    const [form, setForm] = useState({
        summary: '',
        description: '',
        location: '',
        start: { dateTime: '', timeZone: 'America/Argentina/Cordoba' },
        end: { dateTime: '', timeZone: 'America/Argentina/Cordoba' },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
        colorId: '10'
    })

    useEffect(() => {
        if (evento) {
            setForm({
                summary: evento.summary || '',
                description: evento.description || '',
                location: evento.location || '',
                start: {
                    dateTime: evento.start?.dateTime || '',
                    timeZone: evento.start?.timeZone || 'America/Argentina/Cordoba'
                },
                end: {
                    dateTime: evento.end?.dateTime || '',
                    timeZone: evento.end?.timeZone || 'America/Argentina/Cordoba'
                },
                reminders: evento.reminders || { useDefault: false, overrides: [] },
                colorId: evento.colorId || '10'
            })
        }
    }, [evento])

    const handleChange = (e) => {
        const { name, value } = e.target
        if (['summary', 'description', 'location'].includes(name)) {
            setForm(f => ({ ...f, [name]: value }))
        } else if (name === 'start') {
            setForm(f => ({ ...f, start: { ...f.start, dateTime: value } }))
        } else if (name === 'end') {
            setForm(f => ({ ...f, end: { ...f.end, dateTime: value } }))
        } else if (name === 'colorId') {
            setForm(f => ({ ...f, colorId: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const resultado = evento
                ? await calendarService.updateEvento(evento.id, form)
                : await calendarService.createEvento(form)
            onGuardar(resultado)
        } catch (err) {
            console.error('Error guardando evento:', err)
        }
    }

    const handleEliminar = async () => {
        if (!evento) return
        try {
            await calendarService.deleteEvento(evento.id)
            onEliminarLocal(evento.id)
            onCerrar()
        } catch (err) {
            console.error('Error eliminando evento:', err)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="modal-content">
            <h3 className="text-xl font-semibold mb-4">
                {evento ? 'Editar Evento' : 'Crear Evento'}
            </h3>

            <div className="form-group">
                <label>Título</label>
                <input
                    name="summary"
                    value={form.summary}
                    onChange={handleChange}
                    required
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>Descripción</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>Lugar</label>
                <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="grid grid-cols-2 grid-gap-md">
                <div className="form-group">
                    <label>Inicio</label>
                    <input
                        type="datetime-local"
                        name="start"
                        value={form.start.dateTime}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Fin</label>
                    <input
                        type="datetime-local"
                        name="end"
                        value={form.end.dateTime}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Color</label>
                <select
                    name="colorId"
                    value={form.colorId}
                    onChange={handleChange}
                    className="form-input"
                >
                    {colorOptions.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-actions">
                {evento && (
                    <button
                        type="button"
                        onClick={handleEliminar}
                        className="btn-eliminar"
                    >
                        Eliminar
                    </button>
                )}
                <button
                    type="button"
                    onClick={onCerrar}
                    className="btn-cancelar"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn-guardar"
                >
                    {evento ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    )
}

