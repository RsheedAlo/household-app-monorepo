import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API_URL } from "../config";

export default function Login({ setUserId }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setUserId(data.user_id);
                navigate("/");
                return;
            }

            if (Array.isArray(data.detail)) {
                setError(data.detail[0]?.msg || "Login fehlgeschlagen.");
            } else {
                setError(data.detail || "Login fehlgeschlagen.");
            }
        } catch {
            setError("Netzwerkfehler. Laeuft das Backend?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <section className="auth-card">
                <p className="section-kicker">[Auth]</p>
                <h2 className="auth-card__title">Anmelden</h2>
                <p className="auth-card__copy">
                    Melde dich mit deinem bestehenden Konto an, um auf Haushalte, Einladungen und Verwaltungsaktionen zuzugreifen.
                </p>

                {error && <p className="message-banner message-banner--error">{error}</p>}

                <form onSubmit={handleLogin} className="auth-form">
                    <label className="form-field">
                        <span>E-Mail</span>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="text-input"
                        />
                    </label>

                    <label className="form-field">
                        <span>Passwort</span>
                        <input
                            type="password"
                            placeholder="Passwort"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="text-input"
                        />
                    </label>

                    <button type="submit" disabled={isLoading} className="button-primary button-primary--full">
                        {isLoading ? "Lade..." : "Anmelden"}
                    </button>
                </form>

                <p className="auth-card__footer">
                    Noch nicht registriert? <Link to="/register">Konto erstellen</Link>
                </p>
            </section>
        </div>
    );
}
