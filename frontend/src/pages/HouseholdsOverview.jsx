import { useState } from "react";
import { API_URL } from "../config";

export default function HouseholdsOverview({ userId, households, refreshHouseholds, setActiveHousehold }) {
    const [newHouseholdName, setNewHouseholdName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newHouseholdName.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/households/?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newHouseholdName })
            });

            if (response.ok) {
                const newHousehold = await response.json();
                setNewHouseholdName("");

                await refreshHouseholds(userId);
                setActiveHousehold(newHousehold);
            } else {
                console.error("Backend-Fehler:", await response.text());
            }
        } catch (error) {
            console.error("Netzwerkfehler", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '30px' }}>🏡 Meine Haushalte</h2>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Übersicht</h3>
                {households.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Du bist noch in keinem Haushalt. Gründe jetzt deinen ersten!</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {households.map((h) => (
                            <li key={h.id} style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{h.name}</span>
                                <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', background: '#e0e0e0' }}>{h.role.toUpperCase()}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ background: '#fff', padding: '20px', border: '1px solid #0070f3', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,112,243,0.1)' }}>
                <h3 style={{ color: '#0070f3', marginTop: 0 }}>+ Neuen Haushalt gründen</h3>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <input
                        type="text"
                        placeholder="z.B. Uni WG..."
                        value={newHouseholdName}
                        onChange={(e) => setNewHouseholdName(e.target.value)}
                        required
                        style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isLoading ? "Erstelle..." : "Gründen"}
                    </button>
                </form>
            </div>
        </div>
    );
}