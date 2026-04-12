import { useEffect, useState } from "react";

import { API_URL } from "../config";

export default function Notifications({
    userId,
    refreshHouseholds,
    setNotificationCount,
}) {
    const [pendingInvites, setPendingInvites] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [processingInviteId, setProcessingInviteId] = useState("");

    const loadPendingInvites = async () => {
        if (!userId) {
            setPendingInvites([]);
            setNotificationCount(0);
            return;
        }

        const response = await fetch(`${API_URL}/households/invites/user/${userId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Einladungen konnten nicht geladen werden.");
        }

        setPendingInvites(data);
        setNotificationCount(data.length);
    };

    useEffect(() => {
        const run = async () => {
            if (!userId) {
                setPendingInvites([]);
                setMessage("");
                setError("");
                setNotificationCount(0);
                return;
            }

            try {
                await loadPendingInvites();
            } catch (loadError) {
                setError(loadError.message);
            }
        };

        run();
    }, [userId]);

    const handleInviteDecision = async (inviteId, action) => {
        if (!userId) {
            return;
        }

        setProcessingInviteId(inviteId);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/households/invites/${inviteId}/${action}?user_id=${userId}`, {
                method: "POST",
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Einladung konnte nicht verarbeitet werden.");
                return;
            }

            if (action === "accept") {
                await refreshHouseholds(userId);
                setMessage("Einladung angenommen. Der Haushalt steht jetzt in deiner Liste.");
            } else {
                setMessage("Einladung abgelehnt.");
            }

            await loadPendingInvites();
        } catch {
            setError("Netzwerkfehler beim Verarbeiten der Einladung.");
        } finally {
            setProcessingInviteId("");
        }
    };

    return (
        <div className="stack-layout">
            <section className="hero hero--dashboard">
                <div className="hero__content">
                    <p className="section-kicker">[Core]</p>
                    <h2 className="hero__title">Benachrichtigungen</h2>
                    <p className="hero__lead">
                        Hier siehst du offene Haushalts-Einladungen und kannst sie direkt annehmen oder ablehnen.
                    </p>
                </div>
            </section>

            <section className="section-card">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Core]</p>
                        <h3 className="section-title">Offene Einladungen</h3>
                    </div>
                    <span className="notification-pill">{pendingInvites.length} offen</span>
                </div>

                {error && <p className="message-banner message-banner--error">{error}</p>}
                {message && <p className="message-banner message-banner--success">{message}</p>}

                {pendingInvites.length === 0 ? (
                    <p className="section-empty">Aktuell gibt es keine offenen Einladungen.</p>
                ) : (
                    <div className="invite-list">
                        {pendingInvites.map((invite) => (
                            <article key={invite.id} className="invite-card">
                                <div>
                                    <p className="invite-card__title">{invite.household_name}</p>
                                    <p className="invite-card__meta">Rolle nach Annahme: {invite.role}</p>
                                    <p className="invite-card__meta">
                                        Gueltig bis: {new Date(invite.expires_at).toLocaleString()}
                                    </p>
                                </div>

                                <div className="invite-card__actions">
                                    <button
                                        type="button"
                                        disabled={processingInviteId === invite.id}
                                        onClick={() => handleInviteDecision(invite.id, "accept")}
                                        className="button-primary"
                                    >
                                        {processingInviteId === invite.id ? "..." : "Annehmen"}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingInviteId === invite.id}
                                        onClick={() => handleInviteDecision(invite.id, "decline")}
                                        className="button-secondary button-secondary--danger"
                                    >
                                        Ablehnen
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
