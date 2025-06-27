// src/components/EventForm.jsx
import React, { useState, useEffect } from 'react'
import * as calendarService from '../services/calendarService'

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

    function handleChange(e) {
        const { name, value } = e.target
        if (name === 'summary' || name === 'description' || name === 'location') {
            setForm(f => ({ ...f, [name]: value }))
        }
        if (name === 'start') {
            setForm(f => ({ ...f, start: { ...f.start, dateTime: value } }))
        }
        if (name === 'end') {
            setForm(f => ({ ...f, end: { ...f.end, dateTime: value } }))
        }
        if (name === 'colorId') {
            setForm(f => ({ ...f, colorId: value }))
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            let resultado
            if (evento) {
                resultado = await calendarService.updateEvento(evento.id, form)
            } else {
                resultado = await calendarService.createEvento(form)
            }
            onGuardar(resultado)
        } catch (err) {
            console.error('Error guardando evento:', err)
        }
    }

    async function handleEliminar() {
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold">
                {evento ? 'Editar Evento' : 'Crear Evento'}
            </h3>

            <div>
                <label className="block font-medium">Título</label>
                <input
                    name="summary"
                    value={form.summary}
                    onChange={handleChange}
                    required
                    className="w-full border rounded p-2"
                />
            </div>

            <div>
                <label className="block font-medium">Descripción</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
            </div>

            <div>
                <label className="block font-medium">Lugar</label>
                <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium">Inicio</label>
                    <input
                        type="datetime-local"
                        name="start"
                        value={form.start.dateTime}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                    />
                </div>
                <div>
                    <label className="block font-medium">Fin</label>
                    <input
                        type="datetime-local"
                        name="end"
                        value={form.end.dateTime}
                        onChange={handleChange}
                        required
                        className="w-full border rounded p-2"
                    />
                </div>
            </div>

            <div>
                <label className="block font-medium">Color</label>
                <select
                    name="colorId"
                    value={form.colorId}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                >
                    {colorOptions.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end space-x-3">
                {evento && (
                    <button
                        type="button"
                        onClick={handleEliminar}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Eliminar
                    </button>
                )}
                <button
                    type="button"
                    onClick={onCerrar}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {evento ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    )
}
