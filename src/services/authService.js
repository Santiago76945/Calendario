// src/services/authService.js

import { STORAGE_KEYS } from '../constants/storageKeys'

export function getExpectedAuthCode() {
    return import.meta.env.VITE_AUTH_CODE || ''
}

export function isAuthRequired() {
    return Boolean(getExpectedAuthCode())
}

export function isAuthenticated() {
    if (!isAuthRequired()) {
        return true
    }

    try {
        return window.localStorage.getItem(STORAGE_KEYS.AUTH_OK) === 'true'
    } catch (error) {
        console.error('No se pudo leer el estado de auth:', error)
        return false
    }
}

export function validateAuthCode(inputCode) {
    const expectedCode = getExpectedAuthCode()

    if (!expectedCode) {
        return true
    }

    return String(inputCode).trim() === String(expectedCode).trim()
}

export function persistAuthenticated() {
    try {
        window.localStorage.setItem(STORAGE_KEYS.AUTH_OK, 'true')
    } catch (error) {
        console.error('No se pudo persistir la auth:', error)
    }
}

export function clearAuthenticated() {
    try {
        window.localStorage.removeItem(STORAGE_KEYS.AUTH_OK)
    } catch (error) {
        console.error('No se pudo limpiar la auth:', error)
    }
}