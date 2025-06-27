// src/components/AuthModal.jsx

import React, { useState } from 'react'
import useAuth from '../hooks/useAuth'
import '../styles/auth-modal.css'

export default function AuthModal() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const { login } = useAuth()

    const handleSubmit = (e) => {
        e.preventDefault()
        const success = login(code.trim())
        if (!success) {
            setError('Código incorrecto. Intenta nuevamente.')
        }
    }

    return (
        <div className="auth-overlay">
            <div className="auth-modal">
                <h2>Acceso restringido</h2>
                <p>Introduce el código de autorización para continuar:</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value)
                            setError('')
                        }}
                        placeholder="Código de acceso"
                        className="auth-input"
                        required
                    />
                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="auth-button">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    )
}
