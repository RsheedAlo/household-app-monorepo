import { useEffect, useState } from "react";

import { API_URL } from "../config";

export default function HouseholdSettings({
    userId,
    activeHousehold,
    households,
    refreshHouseholds,
    setActiveHousehold,
}) {
    const [householdDetails, setHouseholdDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [editedName, setEditedName] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [roleUpdateUserId, setRoleUpdateUserId] = useState("");
    const [isDeletingHousehold, setIsDeletingHousehold] = useState(false);

    const members = householdDetails?.members || [];
    const householdName = householdDetails?.name || activeHousehold?.name || "Kein Haushalt aktiv";
    const trimmedEditedName = editedName.trim();
    const isNameChanged = trimmedEditedName !== "" && trimmedEditedName !== householdName;
    const isNameTooShort = trimmedEditedName.length > 0 && trimmedEditedName.length < 2;
    const canSubmitRename = !!activeHousehold?.id && isNameChanged && !isNameTooShort && !isSavingName;
    const currentUserMember = members.find((member) => member.user_id === userId);
    const isCurrentUserAdmin = currentUserMember?.role === "admin";
    const activeHouseholdSummary = households.find((household) => household.id === activeHousehold?.id);
    const isCurrentUserCreatorAdmin = isCurrentUserAdmin && activeHouseholdSummary?.created_by === userId;

    const loadHouseholdDetails = async () => {
        if (!userId || !activeHousehold?.id) {
            setHouseholdDetails(null);
            setEditedName("");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_URL}/households/${activeHousehold.id}?user_id=${userId}`);
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Haushaltsdetails konnten nicht geladen werden.");
                setHouseholdDetails(null);
                return;
            }

            setHouseholdDetails(data);
            setEditedName(data.name);
        } catch {
            setError("Netzwerkfehler beim Laden der Haushaltsdetails.");
            setHouseholdDetails(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHouseholdDetails();
    }, [activeHousehold?.id, userId]);

    const handleRename = async (event) => {
        event.preventDefault();
        if (!userId || !activeHousehold?.id || !trimmedEditedName || isNameTooShort) {
            setError("Der Haushaltsname muss mindestens 2 Zeichen lang sein.");
            setSuccessMessage("");
            return;
        }

        setIsSavingName(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/households/${activeHousehold.id}?user_id=${userId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: trimmedEditedName }),
                },
            );
            const data = await response.json();

            if (!response.ok) {
                if (Array.isArray(data.detail)) {
                    setError(data.detail[0]?.msg || "Haushalt konnte nicht umbenannt werden.");
                } else {
                    setError(data.detail || "Haushalt konnte nicht umbenannt werden.");
                }
                return;
            }

            setHouseholdDetails((current) => (current ? { ...current, name: data.name } : current));
            setActiveHousehold((current) => (current ? { ...current, name: data.name } : current));
            setEditedName(data.name);
            setSuccessMessage("Haushaltsname erfolgreich gespeichert.");
            await refreshHouseholds(userId);
        } catch {
            setError("Netzwerkfehler beim Umbenennen des Haushalts.");
        } finally {
            setIsSavingName(false);
        }
    };

    const handleCreateInvite = async (event) => {
        event.preventDefault();
        if (!userId || !activeHousehold?.id || !inviteEmail.trim()) {
            return;
        }

        setIsCreatingInvite(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/households/${activeHousehold.id}/invites?user_id=${userId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: inviteEmail.trim() }),
                },
            );
            const data = await response.json();

            if (!response.ok) {
                if (Array.isArray(data.detail)) {
                    setError(data.detail[0]?.msg || "Einladung konnte nicht erstellt werden.");
                } else {
                    setError(data.detail || "Einladung konnte nicht erstellt werden.");
                }
                return;
            }

            setInviteEmail("");
            if (data.email_delivery_status === "sent") {
                setSuccessMessage(
                    `Einladung fuer ${data.email} wurde gespeichert und die Supabase-E-Mail wurde angestossen.`,
                );
            } else if (data.email_delivery_status === "existing_user") {
                setSuccessMessage(
                    `Einladung fuer ${data.email} wurde gespeichert. Bestehende Nutzer sehen sie nach dem Login in den Benachrichtigungen.`,
                );
            } else {
                setSuccessMessage(
                    `Einladung fuer ${data.email} wurde gespeichert. Der Nutzer kann sie nach dem Login in den Benachrichtigungen annehmen.`,
                );
            }
        } catch {
            setError("Netzwerkfehler beim Erstellen der Einladung.");
        } finally {
            setIsCreatingInvite(false);
        }
    };

    const handleRoleChange = async (memberUserId, nextRole, displayName) => {
        if (!userId || !activeHousehold?.id) {
            return;
        }

        setRoleUpdateUserId(memberUserId);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/households/${activeHousehold.id}/members/${memberUserId}/role?user_id=${userId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: nextRole }),
                },
            );
            const data = await response.json();

            if (!response.ok) {
                if (Array.isArray(data.detail)) {
                    setError(data.detail[0]?.msg || "Rolle konnte nicht geaendert werden.");
                } else {
                    setError(data.detail || "Rolle konnte nicht geaendert werden.");
                }
                return;
            }

            setSuccessMessage(`${displayName} hat jetzt die Rolle ${data.role}.`);
            await loadHouseholdDetails();
            await refreshHouseholds(userId);
        } catch {
            setError("Netzwerkfehler beim Aendern der Rolle.");
        } finally {
            setRoleUpdateUserId("");
        }
    };

    const handleRemoveMember = async (memberUserId, displayName) => {
        if (!userId || !activeHousehold?.id) {
            return;
        }

        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/households/${activeHousehold.id}/members/${memberUserId}?user_id=${userId}`,
                { method: "DELETE" },
            );
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Mitglied konnte nicht entfernt werden.");
                return;
            }

            setSuccessMessage(`${displayName} wurde aus dem Haushalt entfernt.`);
            await loadHouseholdDetails();
        } catch {
            setError("Netzwerkfehler beim Entfernen des Mitglieds.");
        }
    };

    const handleDeleteHousehold = async () => {
        if (!userId || !activeHousehold?.id) {
            return;
        }

        const confirmed = window.confirm(
            `Willst du den Haushalt "${householdName}" wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`,
        );
        if (!confirmed) {
            return;
        }

        setIsDeletingHousehold(true);
        setError("");
        setSuccessMessage("");

        try {
            const deletedHouseholdId = activeHousehold.id;
            const response = await fetch(
                `${API_URL}/households/${deletedHouseholdId}?user_id=${userId}`,
                { method: "DELETE" },
            );
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Haushalt konnte nicht geloescht werden.");
                return;
            }

            await refreshHouseholds(userId);
            const remainingResponse = await fetch(`${API_URL}/households/user/${userId}`);
            const remainingHouseholds = remainingResponse.ok ? await remainingResponse.json() : [];

            setHouseholdDetails(null);
            setEditedName("");
            setActiveHousehold(remainingHouseholds[0] || null);
            setSuccessMessage("Haushalt erfolgreich geloescht.");
        } catch {
            setError("Netzwerkfehler beim Loeschen des Haushalts.");
        } finally {
            setIsDeletingHousehold(false);
        }
    };

    if (!activeHousehold?.id) {
        return (
            <div className="stack-layout">
                <section className="section-card">
                    <div className="section-card__header">
                        <div>
                            <p className="section-kicker">[Core]</p>
                            <h2 className="section-title">Haushaltsverwaltung</h2>
                        </div>
                        <p className="section-note">
                            Waehle zuerst einen Haushalt aus, um Mitglieder, Namen und Einladungen zu verwalten.
                        </p>
                    </div>
                    <p className="section-empty">Aktuell ist kein Haushalt ausgewaehlt.</p>
                </section>
            </div>
        );
    }

    return (
        <div className="stack-layout">
            {isLoading && <p className="section-empty">Lade Haushaltsdetails...</p>}
            {error && <p className="message-banner message-banner--error">{error}</p>}
            {successMessage && <p className="message-banner message-banner--success">{successMessage}</p>}

            <section className="section-card section-card--compact">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Core]</p>
                        <h3 className="section-title settings-section-title">Bearbeiten</h3>
                    </div>
                    <p className="section-note">
                        Passe den Namen des Haushalts direkt an.
                    </p>
                </div>

                <form onSubmit={handleRename} className="settings-row-form">
                    <input
                        type="text"
                        value={editedName}
                        onChange={(event) => {
                            setEditedName(event.target.value);
                            setError("");
                            setSuccessMessage("");
                        }}
                        placeholder="z.B. WG Sued"
                        required
                        className="text-input"
                    />
                    <button type="submit" disabled={!canSubmitRename} className="button-primary">
                        {isSavingName ? "Speichere..." : "Speichern"}
                    </button>
                </form>

                <p className={`settings-helper${isNameTooShort ? " settings-helper--error" : ""}`}>
                    {isNameTooShort
                        ? "Der Haushaltsname muss mindestens 2 Zeichen lang sein."
                        : "Der neue Name wird nach dem Speichern sofort fuer alle Mitglieder sichtbar."}
                </p>
            </section>

            <section className="section-card">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Core]</p>
                        <h3 className="section-title">Mitglieder und Rollen</h3>
                    </div>
                    <div className="section-card__actions">
                        {isCurrentUserAdmin && (
                            <form onSubmit={handleCreateInvite} className="settings-inline-invite">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(event) => {
                                        setInviteEmail(event.target.value);
                                        setError("");
                                        setSuccessMessage("");
                                    }}
                                    placeholder="E-Mail zum Einladen"
                                    required
                                    className="text-input settings-inline-invite__input"
                                />
                                <button
                                    type="submit"
                                    disabled={isCreatingInvite || !inviteEmail.trim()}
                                    className="button-primary settings-add-button"
                                    aria-label="Einladung erstellen"
                                    title="Mitglied einladen"
                                >
                                    {isCreatingInvite ? "..." : "+"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="section-note">
                    Hier verwaltest du Rollen, Rechte und die Mitgliedschaft im aktuell ausgewaehlten Haushalt.
                </p>

                {!isCurrentUserAdmin && (
                    <div className="settings-inline-note">
                        Nur Admins koennen Rollen, Einladungen und sensible Haushaltsaktionen aendern.
                    </div>
                )}

                {isCurrentUserAdmin && (
                    <p className="settings-helper settings-helper--spaced">
                        Bestehende Nutzer sehen die Einladung nach dem Login unter Benachrichtigungen.
                    </p>
                )}

                <div className="member-list">
                    {members.map((member) => (
                        <article key={member.user_id} className="member-card">
                            <div className="member-card__main">
                                <div className="member-card__identity">
                                    <div className="member-card__avatar">{member.display_name.charAt(0)}</div>
                                    <div>
                                        <p className="member-card__name">{member.display_name}</p>
                                        <p className="member-card__meta">
                                            {member.user_id === userId ? "Du" : "Haushaltsmitglied"}
                                        </p>
                                    </div>
                                </div>

                                <div className="household-card__badges">
                                    <span className={`role-badge role-badge--${member.role}`}>
                                        {member.role.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {isCurrentUserAdmin && member.user_id !== userId && (
                                <div className="member-card__actions">
                                    <select
                                        value={member.role}
                                        disabled={roleUpdateUserId === member.user_id}
                                        onChange={(event) =>
                                            handleRoleChange(
                                                member.user_id,
                                                event.target.value,
                                                member.display_name,
                                            )
                                        }
                                        className="member-select"
                                        aria-label={`Rolle fuer ${member.display_name}`}
                                    >
                                        <option value="member">member</option>
                                        <option value="admin">admin</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(member.user_id, member.display_name)}
                                        className="button-secondary button-secondary--danger"
                                    >
                                        Entfernen
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                {!isLoading && members.length === 0 && !error && (
                    <p className="section-empty">Fuer diesen Haushalt wurden noch keine Mitglieder gefunden.</p>
                )}
            </section>

            {isCurrentUserCreatorAdmin && (
                <div className="settings-footer-action">
                    <button
                        type="button"
                        disabled={isDeletingHousehold}
                        onClick={handleDeleteHousehold}
                        className="button-secondary button-secondary--danger"
                    >
                        {isDeletingHousehold ? "Loesche..." : "Endgueltig loeschen"}
                    </button>
                </div>
            )}

            {!isCurrentUserAdmin && (
                <section className="section-card section-card--compact">
                    <p className="section-empty">Nur Admins koennen Rollen, Einladungen und Haushaltsaktionen aendern.</p>
                </section>
            )}
        </div>
    );
}
