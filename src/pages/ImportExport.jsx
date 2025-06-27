// src/pages/ImportExport.jsx
import React, { useState } from 'react'
import * as calendarService from '../services/calendarService'

export default function ImportExport() {
    const [jsonInput, setJsonInput] = useState('')
    const [resultado, setResultado] = useState(null)
    const [errorParseo, setErrorParseo] = useState(null)
    const [importando, setImportando] = useState(false)

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
        <div className="p-6">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Importar / Exportar Eventos</h2>
            </header>

            <div className="mb-4">
                <textarea
                    className="w-full h-48 p-2 border rounded"
                    placeholder="Pega tu JSON aquí..."
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                />
            </div>
            {errorParseo && <p className="text-red-500 mb-2">{errorParseo}</p>}
            <button
                className="px-4 py-2 bg-green-500 text-white rounded mb-6"
                disabled={importando}
                onClick={handleImportar}
            >
                {importando ? 'Importando...' : 'Importar Eventos'}
            </button>

            {resultado && (
                <div>
                    {resultado.exitos.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 border rounded">
                            <strong>Éxitos:</strong>
                            <ul className="list-disc pl-5">
                                {resultado.exitos.map((e) => (
                                    <li key={e.index}>
                                        Evento #{e.index + 1} creado con ID: {e.id}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {resultado.errores.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded">
                            <strong>Errores:</strong>
                            <ul className="list-disc pl-5">
                                {resultado.errores.map((e) => (
                                    <li key={e.index}>
                                        Evento #{e.index + 1}: {e.mensaje}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
