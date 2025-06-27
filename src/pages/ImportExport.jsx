// src/pages/ImportExport.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import * as calendarService from '../services/calendarService'
import '../styles/importexport.css'
import '../styles/importexport-help.css'

export default function ImportExport() {
    const [jsonInput, setJsonInput] = useState('')
    const [resultado, setResultado] = useState(null)
    const [errorParseo, setErrorParseo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [showHelp, setShowHelp] = useState(false)

    function validarEvento(obj) {
        if (!obj.summary || !obj.start?.dateTime || !obj.end?.dateTime) {
            return 'Faltan campos obligatorios: summary, start.dateTime o end.dateTime'
        }
        return null
    }

    async function handleImportar() {
        setErrorParseo(null)
        setResultado(null)
        let parsed

        try {
            parsed = JSON.parse(jsonInput)
        } catch (err) {
            setErrorParseo('JSON inválido: ' + err.message)
            return
        }

        const eventosArray = Array.isArray(parsed) ? parsed : [parsed]
        setImportando(true)
        const exitos = []
        const errores = []

        for (let i = 0; i < eventosArray.length; i++) {
            const ev = eventosArray[i]
            const msg = validarEvento(ev)
            if (msg) {
                errores.push({ index: i, mensaje: msg })
                continue
            }
            try {
                const creado = await calendarService.createEvento(ev)
                exitos.push({ index: i, id: creado.id })
            } catch (err) {
                errores.push({ index: i, mensaje: err.message })
            }
        }

        setResultado({ exitos, errores })
        setImportando(false)
    }

    return (
        <div className="importexport-container">
            <header className="importexport-header">
                <h2 className="importexport-title">Importar / Exportar Eventos</h2>
            </header>

            <textarea
                className="importexport-textarea"
                placeholder="Pega tu JSON aquí..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
            />

            {errorParseo && <p className="error-text">{errorParseo}</p>}

            <div className="importexport-actions">
                <button
                    className="importexport-button"
                    disabled={importando}
                    onClick={handleImportar}
                >
                    {importando ? 'Importando...' : 'Importar Eventos'}
                </button>

                <Link
                    to="/"
                    className="importexport-button"
                    style={{ marginLeft: '0.5rem', textDecoration: 'none' }}
                >
                    Volver al menú
                </Link>

                <button
                    className="importexport-button btn-help"
                    style={{ marginLeft: '0.5rem' }}
                    onClick={() => setShowHelp(true)}
                >
                    ?
                </button>
            </div>

            {resultado && (
                <div className="importexport-result">
                    {resultado.exitos.length > 0 && (
                        <section className="result-section">
                            <strong>Éxitos:</strong>
                            <ul className="result-list">
                                {resultado.exitos.map((e) => (
                                    <li key={e.index}>
                                        Evento #{e.index + 1} creado con ID: {e.id}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {resultado.errores.length > 0 && (
                        <section className="result-section">
                            <strong>Errores:</strong>
                            <ul className="result-list">
                                {resultado.errores.map((e) => (
                                    <li key={e.index}>
                                        Evento #{e.index + 1}: {e.mensaje}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}

            {showHelp && (
                <div className="help-overlay">
                    <div className="help-popup">
                        <button
                            className="help-close-btn"
                            onClick={() => setShowHelp(false)}
                            aria-label="Cerrar instrucciones"
                        >
                            ×
                        </button>
                        <h3>Instrucciones de Importación</h3>
                        <p>Puedes importar uno o varios eventos en formato JSON. Ejemplos:</p>
                        <pre>{`{
  "summary": "Reunión con Cliente",
  "description": "Revisar avances",
  "location": "Zoom",
  "start": {
    "dateTime": "2025-07-10T14:00:00",
    "timeZone": "America/Argentina/Cordoba"
  },
  "end": {
    "dateTime": "2025-07-10T15:00:00",
    "timeZone": "America/Argentina/Cordoba"
  },
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "popup", "minutes": 30 }
    ]
  },
  "colorId": "5"
}`}</pre>
                        <p>O para múltiples eventos:</p>
                        <pre>{`[
  {
    "summary": "Evento A",
    "start": {
      "dateTime": "2025-07-11T09:00:00",
      "timeZone": "America/Argentina/Cordoba"
    },
    "end": {
      "dateTime": "2025-07-11T10:00:00",
      "timeZone": "America/Argentina/Cordoba"
    }
  },
  {
    "summary": "Evento B",
    "start": { "dateTime": "2025-07-12T11:00:00" },
    "end": { "dateTime": "2025-07-12T12:30:00" }
  }
]`}</pre>
                    </div>
                </div>
            )}
        </div>
    )
}
