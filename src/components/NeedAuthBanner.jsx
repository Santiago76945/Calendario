// src/components/NeedAuthBanner.jsx

import '../styles/need-auth-banner.css'

export default function NeedAuthBanner() {
    const handleAuthorize = () => {
        // Redirige al flujo OAuth
        window.location.href = '/.netlify/functions/oauth2/initiateAuth'
    }

    return (
        <div className="need-auth-banner">
            <p className="need-auth-message">
                Para continuar, necesitas autorizar el acceso a Google Calendar.
            </p>
            <button
                className="need-auth-button"
                onClick={handleAuthorize}
            >
                Autorizar con Google
            </button>
        </div>
    )
}
