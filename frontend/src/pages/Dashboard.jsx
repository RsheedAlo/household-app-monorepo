import { Link } from "react-router-dom";
import { useState, useEffect } from 'react'
import { API_URL } from "../config";

const modules = [
    { prefix: "[Kanban]", title: "Aufgaben & Planung", description: "Platzhalter für Board-Struktur." },
    { prefix: "[Einkauf/Vorrat]", title: "Einkauf & Vorrat", description: "Platzhalter für Listen." },
    { prefix: "[Kalender]", title: "Kalender & Termine", description: "Platzhalter für Terminverwaltung." },
];

export default function Dashboard({ userId }) {
    console.log("Das Dashboard sieht diese User-ID:", userId);

    const [userName, setUserName] = useState("");

    useEffect(() => {
        if (userId) {
            const fetchProfile = async () => {
                try {
                    const response = await fetch(`${API_URL}/auth/profile/${userId}`);
                    const data = await response.json();
                    if (response.ok) {
                        setUserName(data.display_name);
                    }
                } catch (error) {
                    console.error("Fehler beim Laden des Profils");
                }
            };

            fetchProfile();
        } else {
            setUserName("");
        }
    }, [userId]);

    return (
        <div className="dashboard">
            <section className="hero" style={{ textAlign: 'center', padding: '40px 20px' }}>
                {/* Begrüßung ändert sich je nach Login-Status */}
                {!userId ? (
                    <>
                        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome to Household App</h2>
                        <p style={{ color: '#666' }}>Melde dich an, um deine WGs und Familien zu verwalten.</p>
                    </>
                ) : (
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Willkommen zurück{userName ? `, ${userName}` : ''}!</h2>
                )}
            </section>

            <section className="grid" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', padding: '20px' }}>
                {modules.map((module) => (
                    <article key={module.prefix} className="card" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                        <p style={{ color: '#0070f3', fontWeight: 'bold', fontSize: '0.9rem' }}>{module.prefix}</p>
                        <h3>{module.title}</h3>
                        <p style={{ color: '#555', marginTop: '10px' }}>{module.description}</p>
                    </article>
                ))}
            </section>
        </div>
    );
}