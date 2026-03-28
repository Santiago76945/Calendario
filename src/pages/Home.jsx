// src/pages/Home.jsx

import { Link } from 'react-router-dom'
import { useState } from 'react'
import CalendarConnectionStatus from '../components/CalendarConnectionStatus'
import '../styles/home.css'

export default function Home() {
    const [, setRefreshKey] = useState(0)

    function handleCalendarAssigned() {
        setRefreshKey((prev) => prev + 1)
    }

    return (
        <div className="home-container">
            <div className="home-hero">
                <h1 className="home-title">Calendario</h1>
                <h2 className="home-subtitle">
                    Crea, revisa y confirma eventos a partir de archivos .ics antes de guardarlos.
                </h2>
            </div>

            <CalendarConnectionStatus onCalendarAssigned={handleCalendarAssigned} />

            <div className="home-options">
                <Link to="/calendario" className="home-option">
                    <span className="home-option-title">Crear y gestionar eventos</span>
                    <span className="home-option-text">
                        Modo manual, modo avanzado y creación asistida por IA con vista previa ICS.
                    </span>
                </Link>

                <Link to="/import-export" className="home-option">
                    <span className="home-option-title">Importar / exportar .ics</span>
                    <span className="home-option-text">
                        Pega, valida, revisa y confirma contenido ICS sobre el calendario asignado.
                    </span>
                </Link>
            </div>

            <div className="home-info-card">
                <h3 className="home-info-title">Cómo funciona ahora</h3>
                <p className="home-info-text">
                    Primero conectas tu cuenta Google, eliges el calendario que quieras usar y esa
                    asignación queda guardada localmente hasta que caduque o decidas cambiarla.
                </p>
            </div>

            <footer className="home-footer">
                © 2026 Santiago Haspert. Prototipo de uso personal.
            </footer>
        </div>
    )
}