import { useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../config";

export default function HouseholdsSection({
    userId,
    households,
    activeHousehold,
    refreshHouseholds,
    setActiveHousehold,
    showCreateButton = true,
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState("create");
    const [newHouseholdName, setNewHouseholdName] = useState("");
    const [createdHousehold, setCreatedHousehold] = useState(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [inviteResults, setInviteResults] = useState([]);
    const [deletingHouseholdId, setDeletingHouseholdId] = useState("");

    const openCreateModal = () => {
        setIsModalOpen(true);
        setCreateStep("create");
        setNewHouseholdName("");
        setCreatedHousehold(null);
        setInviteEmail("");
        setError("");
        setSuccessMessage("");
        setInviteResults([]);
    };

    const closeCreateModal = () => {
        setIsModalOpen(false);
        setCreateStep("create");
        setNewHouseholdName("");
        setCreatedHousehold(null);
        setInviteEmail("");
        setError("");
        setSuccessMessage("");
        setInviteResults([]);
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!newHouseholdName.trim()) {
            return;
        }

        setIsCreating(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_URL}/households/?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newHouseholdName.trim() }),
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.detail || "Haushalt konnte nicht erstellt werden.");
                return;
            }

            await refreshHouseholds(userId);
            setActiveHousehold(data);
            setCreatedHousehold(data);
            setCreateStep("invite");
            setSuccessMessage("Haushalt erstellt. Du kannst jetzt direkt erste Einladungen verschicken.");
        } catch {
            setError("Netzwerkfehler beim Erstellen des Haushalts.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleInvite = async (event) => {
        event.preventDefault();
        if (!inviteEmail.trim() || !createdHousehold?.id) {
            return;
        }

        setIsInviting(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/households/${createdHousehold.id}/invites?user_id=${userId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: inviteEmail.trim() }),
                },
            );
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Einladung konnte nicht erstellt werden.");
                return;
            }

            setInviteResults((current) => [
                ...current,
                {
                    email: data.email,
                    deliveryStatus: data.email_delivery_status || "stored",
                },
            ]);
            setInviteEmail("");
            setSuccessMessage(`Einladung fuer ${data.email} wurde erstellt.`);
        } catch {
            setError("Netzwerkfehler beim Erstellen der Einladung.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleDeleteHousehold = async (household) => {
        if (!userId) {
            return;
        }

        const confirmed = window.confirm(
            `Willst du den Haushalt "${household.name}" wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`,
        );
        if (!confirmed) {
            return;
        }

        setDeletingHouseholdId(household.id);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_URL}/households/${household.id}?user_id=${userId}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Haushalt konnte nicht geloescht werden.");
                return;
            }

            const remaining = households.filter((item) => item.id !== household.id);
            await refreshHouseholds(userId);

            if (activeHousehold?.id === household.id) {
                setActiveHousehold(remaining[0] || null);
            }

            setSuccessMessage("Haushalt erfolgreich geloescht.");
        } catch {
            setError("Netzwerkfehler beim Loeschen des Haushalts.");
        } finally {
            setDeletingHouseholdId("");
        }
    };

    return (
        <>
            <section className="section-card">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Core]</p>
                        <h2 className="section-title">Meine Haushalte</h2>
                    </div>
                    <div className="section-card__actions">
                        <p className="section-note">
                            Waehle einen Haushalt aktiv aus, damit Dashboard und Verwaltung den richtigen Kontext zeigen.
                        </p>
                        {showCreateButton && (
                            <button type="button" onClick={openCreateModal} className="button-primary">
                                + Neuer Haushalt
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="message-banner message-banner--error">{error}</p>}
                {successMessage && <p className="message-banner message-banner--success">{successMessage}</p>}

                {households.length === 0 ? (
                    <div className="section-empty-state">
                        <p className="section-empty">Du bist noch in keinem Haushalt.</p>
                        {showCreateButton && (
                            <button type="button" onClick={openCreateModal} className="button-primary">
                                Ersten Haushalt erstellen
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="household-list">
                        {households.map((household) => {
                            const isActive = household.id === activeHousehold?.id;
                            const canDelete = household.created_by === userId;

                            return (
                                <article
                                    key={household.id}
                                    className={`household-card${isActive ? " household-card--active" : ""}`}
                                >
                                    <div className="household-card__content">
                                        <div>
                                            <p className="household-card__title">{household.name}</p>
                                            <p className="household-card__meta">
                                                {isActive
                                                    ? "Aktiv im Dashboard und in der Verwaltung"
                                                    : "Kann als aktueller Arbeitskontext gesetzt werden"}
                                            </p>
                                        </div>

                                        <div className="household-card__badges">
                                            <span className={`role-badge role-badge--${household.role}`}>
                                                {household.role.toUpperCase()}
                                            </span>
                                            {isActive && <span className="active-badge">Aktiv</span>}
                                            {canDelete && <span className="creator-badge">Ersteller</span>}
                                        </div>
                                    </div>

                                    <div className="household-card__actions">
                                        <button
                                            type="button"
                                            onClick={() => setActiveHousehold(household)}
                                            className="button-secondary"
                                        >
                                            {isActive ? "Aktiv" : "Auswaehlen"}
                                        </button>
                                        <Link
                                            to="/settings"
                                            onClick={() => setActiveHousehold(household)}
                                            className="button-secondary button-secondary--link"
                                        >
                                            Verwalten
                                        </Link>
                                        {canDelete && (
                                            <button
                                                type="button"
                                                disabled={deletingHouseholdId === household.id}
                                                onClick={() => handleDeleteHousehold(household)}
                                                className="button-secondary button-secondary--danger"
                                            >
                                                {deletingHouseholdId === household.id ? "Loesche..." : "Loeschen"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {isModalOpen && (
                <div className="modal-backdrop" role="presentation" onClick={closeCreateModal}>
                    <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-card__header">
                            <div>
                                <p className="section-kicker">[Core]</p>
                                <h3 className="section-title">
                                    {createStep === "create" ? "Neuen Haushalt erstellen" : "Erste Mitglieder einladen"}
                                </h3>
                            </div>
                            <button type="button" onClick={closeCreateModal} className="modal-close">
                                Schliessen
                            </button>
                        </div>

                        {error && <p className="message-banner message-banner--error">{error}</p>}
                        {successMessage && <p className="message-banner message-banner--success">{successMessage}</p>}

                        {createStep === "create" ? (
                            <form onSubmit={handleCreate} className="auth-form">
                                <label className="form-field">
                                    <span>Haushaltsname</span>
                                    <input
                                        type="text"
                                        placeholder="z.B. Uni WG"
                                        value={newHouseholdName}
                                        onChange={(event) => setNewHouseholdName(event.target.value)}
                                        required
                                        className="text-input"
                                    />
                                </label>

                                <p className="section-note">
                                    Du wirst automatisch erster Admin des neuen Haushalts.
                                </p>

                                <div className="modal-card__actions">
                                    <button type="button" onClick={closeCreateModal} className="button-secondary">
                                        Abbrechen
                                    </button>
                                    <button type="submit" disabled={isCreating} className="button-primary">
                                        {isCreating ? "Erstelle..." : "Haushalt erstellen"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="modal-flow">
                                <div className="modal-summary">
                                    <p className="modal-summary__title">{createdHousehold?.name}</p>
                                    <p className="modal-summary__copy">
                                        Der Haushalt ist erstellt und bereits als aktueller Kontext gesetzt.
                                    </p>
                                </div>

                                <form onSubmit={handleInvite} className="auth-form">
                                    <label className="form-field">
                                        <span>E-Mail fuer erste Einladung</span>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={inviteEmail}
                                            onChange={(event) => setInviteEmail(event.target.value)}
                                            className="text-input"
                                        />
                                    </label>

                                    <div className="modal-card__actions">
                                        <button type="submit" disabled={isInviting || !inviteEmail.trim()} className="button-primary">
                                            {isInviting ? "Sende..." : "Einladung senden"}
                                        </button>
                                        <button type="button" onClick={closeCreateModal} className="button-secondary">
                                            Fertig
                                        </button>
                                    </div>
                                </form>

                                {inviteResults.length > 0 && (
                                    <div className="invite-result-list">
                                        {inviteResults.map((invite, index) => (
                                            <div key={`${invite.email}-${index}`} className="invite-result-item">
                                                <span>{invite.email}</span>
                                                <span className="invite-result-status">
                                                    {invite.deliveryStatus === "sent"
                                                        ? "Mail angestossen"
                                                        : invite.deliveryStatus === "existing_user"
                                                          ? "Sichtbar nach Login"
                                                          : "Einladung gespeichert"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
