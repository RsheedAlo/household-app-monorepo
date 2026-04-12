import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API_URL } from "../config";

export default function Register({ setUserId }) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/auth/signup?display_name=${encodeURIComponent(displayName)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                },
            );
            const data = await response.json();

            if (response.ok) {
                setUserId(data.user_id);
                navigate("/");
                return;
            }

            if (Array.isArray(data.detail)) {
                setError(data.detail[0]?.msg || "Registrierung fehlgeschlagen.");
            } else {
                setError(data.detail || "Registrierung fehlgeschlagen.");
            }
        } catch {
            setError("Netzwerkfehler beim Registrieren.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <section className="auth-card">
                <p className="section-kicker">[Auth]</p>
                <h2 className="auth-card__title">Konto erstellen</h2>
                <p className="auth-card__copy">
                    Lege ein neues Konto an, um Haushalten beizutreten, Einladungen anzunehmen oder selbst Haushalte zu gruenden.
                </p>

                {error && <p className="message-banner message-banner--error">{error}</p>}

                <form onSubmit={handleSignup} className="auth-form">
                    <label className="form-field">
                        <span>Anzeigename</span>
                        <input
                            type="text"
                            placeholder="Dein Name"
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            required
                            className="text-input"
                        />
                    </label>

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
                        {isLoading ? "Erstelle Konto..." : "Registrieren"}
                    </button>
                </form>

                <p className="auth-card__footer">
                    Du hast schon ein Konto? <Link to="/login">Zum Login</Link>
                </p>
            </section>
        </div>
    );
}
