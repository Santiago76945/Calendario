// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import useAuth from './hooks/useAuth'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import Calendario from './pages/Calendario'
import ImportExport from './pages/ImportExport'

export default function App() {
    const { isAuthenticated } = useAuth()

    return (
        <>
            {!isAuthenticated && <AuthModal />}

            {isAuthenticated && (
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/calendario" element={<Calendario />} />
                        <Route path="/import-export" element={<ImportExport />} />
                    </Routes>
                </Router>
            )}
        </>
    )
}
