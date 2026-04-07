import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000"; // Prüfe deinen Port!

export default function Register({ setUserId }) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate(); // Um den User nach Erfolg weiterzuleiten

    const handleSignup = async (e) => {
        e.preventDefault();
        setMessage("Lade...");
        try {
            const response = await fetch(`${API_URL}/auth/signup?display_name=${encodeURIComponent(displayName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                setUserId(data.user_id);
                // Später leiten wir hier zur Haushalts-Gründung weiter, für jetzt ab aufs Dashboard
                navigate("/");
            } else {
                setMessage("Fehler: " + data.detail);
            }
        } catch (error) {
            setMessage("Netzwerkfehler.");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
            <h2>Neues Konto erstellen</h2>
            {message && <p style={{ color: 'red' }}>{message}</p>}

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input type="text" placeholder="Dein Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required style={{ padding: '10px' }} />
                <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px' }}/>
                <input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px' }}/>
                <button type="submit" style={{ padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Registrieren</button>
            </form>

            <p style={{ marginTop: '20px' }}>
                Du hast schon ein Konto? <Link to="/login" style={{ color: '#0070f3' }}>Zum Login</Link>
            </p>
        </div>
    );
}