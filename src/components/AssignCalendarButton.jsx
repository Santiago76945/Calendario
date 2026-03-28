// src/components/AssignCalendarButton.jsx

import React, { useState } from 'react'
import { connectAndFetchCalendars } from '../services/googleCalendarConnectionService'
import CalendarPickerModal from './CalendarPickerModal'

export default function AssignCalendarButton({
    buttonText = 'Asignar calendario',
    className = 'button-primary',
    onCalendarAssigned
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [openPicker, setOpenPicker] = useState(false)
    const [calendars, setCalendars] = useState([])

    async function handleConnect() {
        setLoading(true)
        setError('')

        try {
            const items = await connectAndFetchCalendars()
            setCalendars(items)
            setOpenPicker(true)
        } catch (err) {
            console.error(err)
            setError(err.message || 'No se pudo iniciar la conexión con Google.')
        } finally {
            setLoading(false)
        }
    }

    function handleClosePicker() {
        setOpenPicker(false)
    }

    function handleAssigned(calendar) {
        setOpenPicker(false)

        if (typeof onCalendarAssigned === 'function') {
            onCalendarAssigned(calendar)
        }
    }

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={handleConnect}
                disabled={loading}
            >
                {loading ? 'Conectando...' : buttonText}
            </button>

            {error ? (
                <p className="error-text" style={{ marginTop: '0.75rem' }}>
                    {error}
                </p>
            ) : null}

            {openPicker && (
                <CalendarPickerModal
                    calendars={calendars}
                    onClose={handleClosePicker}
                    onAssigned={handleAssigned}
                />
            )}
        </>
    )
}