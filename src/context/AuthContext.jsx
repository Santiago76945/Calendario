// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        setIsAuthenticated(localStorage.getItem('authenticated') === 'true')
    }, [])

    const login = (code) => {
        if (code === import.meta.env.VITE_AUTH_CODE) {
            localStorage.setItem('authenticated', 'true')
            setIsAuthenticated(true)
            return true
        }
        return false
    }

    const logout = () => {
        localStorage.removeItem('authenticated')
        setIsAuthenticated(false)
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
