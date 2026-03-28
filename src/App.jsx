// src/App.jsx

import React from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from 'react-router-dom'

import AuthGate from './components/AuthGate'
import Home from './pages/Home'
import Calendario from './pages/Calendario'
import ImportExport from './pages/ImportExport'

export default function App() {
    return (
        <AuthGate>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/calendario" element={<Calendario />} />
                    <Route path="/import-export" element={<ImportExport />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthGate>
    )
}