import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function Login({ setUserId }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            });

            const data = await response.json();

            console.log("Das sagt das Backend:", data);

            if (response.ok) {
                setUserId(data.user_id);
                navigate("/");
            } else {
                if (Array.isArray(data.detail)) {
                    setError(data.detail[0].msg);
                } else {
                    setError(data.detail || "Login fehlgeschlagen.");
                }
                setIsLoading(false);
            }
        } catch (err) {
            setError("Netzwerkfehler. Läuft das Backend?");
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
            <h2>Anmelden</h2>

            {error && <p style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '5px' }}>{error}</p>}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input
                    type="email"
                    placeholder="E-Mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '10px' }}
                />
                <input
                    type="password"
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '10px' }}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{ padding: '12px', background: isLoading ? '#ccc' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {isLoading ? "Lade..." : "Login"}
                </button>
            </form>

            <p style={{ marginTop: '20px' }}>
                Noch nicht registriert? <Link to="/register" style={{ color: '#0070f3' }}>Hier Konto erstellen</Link>
            </p>
        </div>
    );
}