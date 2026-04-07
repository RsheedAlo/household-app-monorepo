import {useState, useEffect} from 'react'
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HouseholdSettings from './pages/HouseholdSettings';
import HouseholdsOverview from './pages/HouseholdsOverview';
import {API_URL} from "./config";

export default function App() {
    // Globaler State, der sich merkt, ob jemand eingeloggt ist
    const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

    const [households, setHouseholds] = useState([]);
    const [activeHousehold, setActiveHousehold] = useState(
        JSON.parse(localStorage.getItem('activeHousehold')) || null
    );

    useEffect(() => {
        if (userId) {
            localStorage.setItem('userId', userId);
            loadHouseholds(userId);
        } else {
            localStorage.removeItem('userId');
            setHouseholds([]);
            setActiveHousehold(null);
        }
    }, [userId]);

    useEffect(() => {
        if (activeHousehold) {
            localStorage.setItem('activeHousehold', JSON.stringify(activeHousehold));
        } else {
            localStorage.removeItem('activeHousehold');
        }
    }, [activeHousehold]);

    const loadHouseholds = async (id) => {
        try {
            const response = await fetch(`${API_URL}/households/user/${id}`);
            if (response.ok) {
                const data = await response.json();
                setHouseholds(data);

                // Wenn noch kein aktiver Haushalt gewählt ist (und wir welche haben), nimm einfach den ersten
                if (data.length > 0 && !activeHousehold) {
                    setActiveHousehold(data[0]);
                }
            }
        } catch (error) {
            console.error("Fehler beim Laden der Haushalte", error);
        }
    };

    return (
        <Router>
            <div style={{fontFamily: 'sans-serif', color: '#333'}}>

                {/* --- NAVBAR --- */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 30px',
                    borderBottom: '1px solid #ddd',
                    background: '#fff'
                }}>
                    <div style={{width: '250px'}}>
                        <h1 style={{margin: 0, fontSize: '1.5rem', fontWeight: 'bold'}}>
                            <Link to="/" style={{textDecoration: 'none', color: 'inherit'}}>Household App</Link>
                        </h1>
                    </div>

                    <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                        {userId && households.length > 0 && (
                            <select
                                value={activeHousehold?.id || ""}
                                onChange={(e) => {
                                    const selected = households.find(h => h.id === e.target.value);
                                    setActiveHousehold(selected);
                                }}
                                style={{
                                    padding: '8px 15px',
                                    borderRadius: '20px',
                                    border: '1px solid #ccc',
                                    background: '#f8f9fa',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                {households.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        )}
                        {userId && households.length === 0 && (
                            <span style={{color: '#888'}}>Kein Haushalt gefunden</span>
                        )}
                    </div>

                    {/* RECHTS: Icons */}
                    <div style={{width: '250px', display: 'flex', justifyContent: 'flex-end', gap: '15px'}}>
                        {userId ? (
                            <>
                                <Link to="/households" style={{ textDecoration: 'none', fontSize: '1.3rem' }} title="Meine Haushalte">🏡</Link>
                                <Link to="/settings" style={{textDecoration: 'none', fontSize: '1.3rem'}}
                                      title="Haushalt verwalten">⚙️</Link>
                                <span onClick={() => setUserId(null)} style={{cursor: 'pointer', fontSize: '1.3rem'}}
                                      title="Abmelden">🚪</span>
                            </>
                        ) : (
                            <Link to="/login" style={{textDecoration: 'none', fontSize: '1.5rem'}}
                                  title="Anmelden">👤</Link>
                        )}
                    </div>
                </header>

                {/* --- DER BODY (Hier werden die Seiten geladen) --- */}
                <main style={{maxWidth: '1000px', margin: '0 auto', padding: '20px'}}>
                    <Routes>
                        <Route path="/" element={<Dashboard userId={userId}/>}/>
                        <Route path="/login" element={<Login setUserId={setUserId}/>}/>
                        <Route path="/register" element={<Register setUserId={setUserId}/>}/>
                        <Route path="/settings" element={<HouseholdSettings userId={userId}/>}/>
                        <Route path="/households" element={
                            <HouseholdsOverview
                                userId={userId}
                                households={households}
                                refreshHouseholds={loadHouseholds}
                                setActiveHousehold={setActiveHousehold}
                            />} />
                    </Routes>
                </main>

            </div>
        </Router>
    );
}
