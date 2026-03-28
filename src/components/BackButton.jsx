// src/components/BackButton.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ label = 'Volver' }) {
    const navigate = useNavigate()

    function handleClick() {
        navigate('/')
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            style={{
                position: 'fixed',
                top: '16px',
                left: '16px',
                zIndex: 9999,

                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',

                padding: '0.6rem 0.9rem',
                borderRadius: '999px',

                border: '1px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',

                color: '#172033',
                fontWeight: 600,
                fontSize: '0.9rem',

                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
            }}
        >
            ← {label}
        </button>
    )
}