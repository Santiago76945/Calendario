// src/pages/Home.jsx

import { Link } from 'react-router-dom'
import '../styles/home.css'

export default function Home() {
    return (
        <div className="home-container">
            <h1 className="home-title">Calendario</h1>
            <h2 className="home-subtitle">
                Una aplicación de Santiago Haspert
            </h2>

            <div className="home-options">
                <Link to="/calendario" className="home-option">
                    Ver calendario
                </Link>
                <Link to="/import-export" className="home-option">
                    Importar y exportar eventos
                </Link>
            </div>

            <footer className="home-footer">
                © 2025 Santiago Haspert. Prototipo de uso personal.
            </footer>
        </div>
    )
}
