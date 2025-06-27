// src/hooks/useAuth.js

import { useState, useEffect } from 'react'

export default function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const auth = localStorage.getItem('authenticated') === 'true'
        setIsAuthenticated(auth)
    }, [])

    function login(code) {
        const secret = import.meta.env.VITE_AUTH_CODE
        if (code === secret) {
            localStorage.setItem('authenticated', 'true')
            setIsAuthenticated(true)
            return true
        }
        return false
    }

    function logout() {
        localStorage.removeItem('authenticated')
        setIsAuthenticated(false)
    }

    return { isAuthenticated, login, logout }
}
