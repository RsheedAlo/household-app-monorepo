import { Link } from "react-router-dom";

export default function HouseholdSettings({ userId }) {
    // Später laden wir diese Liste live aus dem Backend!
    const dummyMembers = [
        { id: "1", name: "Ben (Du)", role: "admin" },
        { id: "2", name: "Anna", role: "member" },
        { id: "3", name: "WG-Staubsauger-Robot", role: "member" }
    ];

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>

            {/* Header mit Zurück-Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <Link to="/" style={{ textDecoration: 'none', fontSize: '1.5rem' }}>⬅️</Link>
                <h2 style={{ margin: 0 }}>Haushaltsverwaltung</h2>
            </div>

            {/* Info-Karte zum Haushalt */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>Deine aktuelle WG</h3>
                <p style={{ margin: 0, color: '#555' }}>
                    Du bist der Admin dieses Haushalts. Hier kannst du Mitglieder verwalten und Einladungen verschicken.
                </p>
            </div>

            {/* Mitglieder-Liste */}
            <h3>Mitglieder ({dummyMembers.length})</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dummyMembers.map((member) => (
                    <li
                        key={member.id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '15px',
                            background: '#fff',
                            border: '1px solid #eaeaea',
                            borderRadius: '6px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0070f3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {member.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: '500' }}>{member.name}</span>
                        </div>

                        <span style={{
                            fontSize: '0.8rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            background: member.role === 'admin' ? '#ffebee' : '#e8f5e9',
                            color: member.role === 'admin' ? '#c62828' : '#2e7d32',
                            fontWeight: 'bold'
                        }}>
              {member.role.toUpperCase()}
            </span>
                    </li>
                ))}
            </ul>

            {/* Button für spätere Invite-Logik */}
            <button style={{
                width: '100%',
                padding: '12px',
                marginTop: '20px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}>
                + Neues Mitglied einladen
            </button>

        </div>
    );
}