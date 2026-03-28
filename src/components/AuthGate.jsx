// src/components/AuthGate.jsx

import React, { useMemo, useState } from 'react'
import {
    isAuthenticated,
    isAuthRequired,
    persistAuthenticated,
    validateAuthCode
} from '../services/authService'

export default function AuthGate({ children }) {
    const authRequired = useMemo(() => isAuthRequired(), [])
    const [allowed, setAllowed] = useState(isAuthenticated())
    const [code, setCode] = useState('')
    const [error, setError] = useState('')

    if (!authRequired || allowed) {
        return children
    }

    function handleSubmit(e) {
        e.preventDefault()
        setError('')

        if (!validateAuthCode(code)) {
            setError('Código incorrecto.')
            return
        }

        persistAuthenticated()
        setAllowed(true)
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                padding: '1rem',
                background: '#f5f7fb'
            }}
        >
            <div
                style={{
                    width: 'min(460px, 100%)',
                    background: '#fff',
                    border: '1px solid #d7deea',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)'
                }}
            >
                <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                    Acceso a la app
                </h1>

                <p style={{ marginTop: 0, color: '#5b6472', lineHeight: 1.6 }}>
                    Introduce el código de acceso. Una vez validado, quedará recordado en este navegador.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="auth-code">Código</label>
                    <input
                        id="auth-code"
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Introduce el código"
                        autoFocus
                    />

                    {error ? (
                        <p className="error-text" style={{ marginBottom: 0 }}>
                            {error}
                        </p>
                    ) : null}

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="button-primary">
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}