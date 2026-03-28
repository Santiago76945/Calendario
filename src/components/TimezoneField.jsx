// src/components/TimezoneField.jsx

import React, { useEffect, useMemo, useState } from 'react'
import {
    DEFAULT_TIMEZONE,
    MANUAL_TIMEZONE_OPTION
} from '../constants/timezones'
import {
    getPopularTimezones,
    getTimezoneSelectValue
} from '../services/timezoneService'

export default function TimezoneField({ value, onChange }) {
    const timezoneOptions = useMemo(() => getPopularTimezones(), [])
    const [selectValue, setSelectValue] = useState(getTimezoneSelectValue(value))
    const [manualValue, setManualValue] = useState(
        getTimezoneSelectValue(value) === MANUAL_TIMEZONE_OPTION
            ? value
            : DEFAULT_TIMEZONE
    )

    useEffect(() => {
        const nextSelectValue = getTimezoneSelectValue(value)
        setSelectValue(nextSelectValue)

        if (nextSelectValue === MANUAL_TIMEZONE_OPTION) {
            setManualValue(value || '')
        } else if (value) {
            setManualValue(value)
        }
    }, [value])

    function handleSelectChange(e) {
        const next = e.target.value
        setSelectValue(next)

        if (next === MANUAL_TIMEZONE_OPTION) {
            const manual = manualValue || ''
            onChange(manual)
            return
        }

        setManualValue(next)
        onChange(next)
    }

    function handleManualChange(e) {
        const next = e.target.value
        setManualValue(next)
        onChange(next)
    }

    return (
        <div className="timezone-field">
            <label htmlFor="timezone-select">Zona horaria</label>

            <select
                id="timezone-select"
                value={selectValue}
                onChange={handleSelectChange}
            >
                {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}

                <option value={MANUAL_TIMEZONE_OPTION}>Otra (escribir manualmente)</option>
            </select>

            {selectValue === MANUAL_TIMEZONE_OPTION && (
                <div style={{ marginTop: '0.75rem' }}>
                    <label htmlFor="timezone-manual">Zona horaria manual</label>
                    <input
                        id="timezone-manual"
                        type="text"
                        value={manualValue}
                        onChange={handleManualChange}
                        placeholder="Ej: America/Argentina/Cordoba"
                    />
                </div>
            )}
        </div>
    )
}

