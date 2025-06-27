// src/pages/Home.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <h1 className="text-4xl font-bold mb-4">Kalendario</h1>
            <h2 className="text-lg text-gray-600 mb-8">
                Una aplicación de Santiago Haspert
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <Link
                    to="/calendario"
                    className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
                >
                    Ver calendario
                </Link>
                <Link
                    to="/import-export"
                    className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
                >
                    Importar y exportar eventos
                </Link>
            </div>

            <footer className="text-sm text-gray-500">
                © 2025 Santiago Haspert. Prototipo de uso personal.
            </footer>
        </div>
    )
}
