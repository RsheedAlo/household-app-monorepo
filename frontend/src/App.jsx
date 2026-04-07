import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
    // Globaler State, der sich merkt, ob jemand eingeloggt ist
    const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

    useEffect(() => {
        if (userId) {
            localStorage.setItem('userId', userId);
        } else {
            localStorage.removeItem('userId');
        }
    }, [userId]);

    return (
        <Router>
            <div style={{ fontFamily: 'sans-serif', color: '#333' }}>

                {/* --- DIE NAVBAR --- */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 30px',
                    borderBottom: '1px solid #ddd',
                    background: '#fff'
                }}>
                    {/* Platzhalter links, damit der Titel perfekt in der Mitte sitzt */}
                    <div style={{ width: '50px' }}></div>

                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Household App</Link>
                    </h1>

                    {/* Anmelde-Icon rechts */}
                    <div style={{ width: '50px', textAlign: 'right' }}>
                        {userId ? (
                            <span
                                onClick={() => setUserId(null)}
                                style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                                title="Abmelden"
                            >
                                🚪
                            </span>
                        ) : (
                            <Link to="/login" style={{ textDecoration: 'none', fontSize: '1.5rem' }} title="Anmelden">
                                👤
                            </Link>
                        )}
                    </div>
                </header>

                {/* --- DER BODY (Hier werden die Seiten geladen) --- */}
                <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
                    <Routes>
                        <Route path="/" element={<Dashboard userId={userId} />} />
                        <Route path="/login" element={<Login setUserId={setUserId} />} />
                        <Route path="/register" element={<Register setUserId={setUserId} />} />
                    </Routes>
                </main>

            </div>
        </Router>
    );
}
