// src/hooks/useAuthToken.js

import { useState, useEffect } from 'react'

/**
 * Hook para manejar el refresh_token de Google Calendar.
 * - Lee de localStorage al montar.
 * - Permite guardar un nuevo token.
 * - Permite borrar el token (logout).
 */
export default function useAuthToken() {
    const [refreshToken, setRefreshToken] = useState(null)

    // Al montar, recupera de localStorage si existe
    useEffect(() => {
        const stored = localStorage.getItem('gcal_refresh_token')
        if (stored) {
            setRefreshToken(stored)
        }
    }, [])

    /**
     * Guarda el refreshToken en localStorage y en el estado
     * @param {string} token 
     */
    function saveToken(token) {
        localStorage.setItem('gcal_refresh_token', token)
        setRefreshToken(token)
    }

    /**
     * Elimina el token (logout)
     */
    function clearToken() {
        localStorage.removeItem('gcal_refresh_token')
        setRefreshToken(null)
    }

    return {
        refreshToken,
        saveToken,
        clearToken
    }
}
