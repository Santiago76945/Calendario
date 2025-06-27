// src/services/authService.js

/**
 * Valida el código de autorización comparándolo
 * con el valor definido en la variable de entorno VITE_AUTH_CODE.
 *
 * @param {string} code - Código ingresado por el usuario.
 * @returns {boolean} - true si coincide, false si no.
 */
export function validateAuthCode(code) {
    const secret = import.meta.env.VITE_AUTH_CODE
    return code === secret
}
