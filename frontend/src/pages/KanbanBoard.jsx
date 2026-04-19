import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

// Die drei Spalten unseres Kanban-Boards
const columns = [
    { key: "todo", title: "To Do" },
    { key: "in_progress", title: "In Progress" },
    { key: "done", title: "Done" },
];

export default function KanbanBoard({ userId, activeHousehold }) {
    // Speichert alle Tasks, die vom Backend geladen werden
    const [tasks, setTasks] = useState([]);

    // Eingabefelder für neue Aufgabe
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Status für UI / Feedback
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Hier werden die Aufgaben nach Status in die 3 Spalten gruppiert
    const groupedTasks = useMemo(() => {
        return {
            todo: tasks.filter((task) => task.status === "todo"),
            in_progress: tasks.filter((task) => task.status === "in_progress"),
            done: tasks.filter((task) => task.status === "done"),
        };
    }, [tasks]);

    // Lädt alle Tasks für den aktuell ausgewählten Haushalt
    const loadTasks = async () => {
        // Falls User oder Haushalt fehlt, können keine Tasks geladen werden
        if (!userId || !activeHousehold?.id) {
            setTasks([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/kanban/${activeHousehold.id}/tasks?user_id=${userId}`,
            );
            const data = await response.json();

            // Falls Backend-Fehler kommt, Fehlermeldung anzeigen
            if (!response.ok) {
                setError(data.detail || "Tasks konnten nicht geladen werden.");
                return;
            }

            setTasks(data);
        } catch {
            setError("Netzwerkfehler beim Laden der Tasks.");
        }
    };

    // Lädt Tasks neu, sobald User oder aktiver Haushalt wechselt
    useEffect(() => {
        loadTasks();
    }, [userId, activeHousehold?.id]);

    // Erstellt eine neue Aufgabe
    const handleCreateTask = async (event) => {
        event.preventDefault();

        // Ohne Titel oder ohne aktiven Haushalt wird nichts gespeichert
        if (!title.trim() || !activeHousehold?.id) {
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_URL}/api/kanban/tasks?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    household_id: activeHousehold.id,
                    title: title.trim(),
                    description: description.trim(),
                    status: "todo", // neue Aufgaben starten immer in "To Do"
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Task konnte nicht erstellt werden.");
                return;
            }

            // Eingabefelder wieder leeren
            setTitle("");
            setDescription("");
            setSuccessMessage("Task erfolgreich erstellt.");

            // Liste nach dem Erstellen neu laden
            await loadTasks();
        } catch {
            setError("Netzwerkfehler beim Erstellen des Tasks.");
        } finally {
            setIsSaving(false);
        }
    };

    // Verschiebt eine Aufgabe in einen anderen Status
    const moveTask = async (task, nextStatus) => {
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_URL}/api/kanban/tasks/${task.id}?user_id=${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Task konnte nicht verschoben werden.");
                return;
            }

            setSuccessMessage("Task verschoben.");
            await loadTasks();
        } catch {
            setError("Netzwerkfehler beim Verschieben des Tasks.");
        }
    };

    // Löscht eine Aufgabe
    const deleteTask = async (taskId) => {
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_URL}/api/kanban/tasks/${taskId}?user_id=${userId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Task konnte nicht gelöscht werden.");
                return;
            }

            setSuccessMessage("Task gelöscht.");
            await loadTasks();
        } catch {
            setError("Netzwerkfehler beim Löschen des Tasks.");
        }
    };

    // Falls niemand eingeloggt ist
    if (!userId) {
        return (
            <section className="section-card">
                <p className="section-empty">Bitte zuerst anmelden, um das Kanban-Board zu nutzen.</p>
            </section>
        );
    }

    // Falls kein Haushalt ausgewählt ist
    if (!activeHousehold?.id) {
        return (
            <section className="section-card">
                <p className="section-empty">
                    Bitte zuerst einen aktiven Haushalt auswählen oder erstellen.
                </p>
            </section>
        );
    }

    return (
        <div className="stack-layout">
            {/* Bereich zum Erstellen neuer Aufgaben */}
            <section className="section-card section-card--accent">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Kanban]</p>
                        <h2 className="section-title">Aufgaben & Planung</h2>
                    </div>
                    <p className="section-note">
                        Aktiver Haushalt: <strong>{activeHousehold.name}</strong>
                    </p>
                </div>

                {/* Fehlermeldung oder Erfolgsmeldung */}
                {error && <p className="message-banner message-banner--error">{error}</p>}
                {successMessage && (
                    <p className="message-banner message-banner--success">{successMessage}</p>
                )}

                <form className="kanban-form" onSubmit={handleCreateTask}>
                    <input
                        className="text-input"
                        type="text"
                        placeholder="Titel der Aufgabe"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                    <textarea
                        className="text-area"
                        placeholder="Beschreibung (optional)"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <button className="button-primary" type="submit" disabled={isSaving}>
                        {isSaving ? "Speichern..." : "Neue Aufgabe erstellen"}
                    </button>
                </form>
            </section>

            {/* Die 3 Kanban-Spalten */}
            <section className="kanban-board">
                {columns.map((column) => (
                    <div key={column.key} className="kanban-column">
                        <div className="kanban-column__header">
                            <h3>{column.title}</h3>
                            <span className="kanban-column__count">
                                {groupedTasks[column.key].length}
                            </span>
                        </div>

                        <div className="kanban-column__body">
                            {groupedTasks[column.key].length === 0 ? (
                                <p className="section-empty">Keine Aufgaben in dieser Spalte.</p>
                            ) : (
                                groupedTasks[column.key].map((task) => (
                                    <article key={task.id} className="kanban-task-card">
                                        <h4>{task.title}</h4>

                                        {/* Beschreibung nur anzeigen, wenn etwas drin steht */}
                                        {task.description && (
                                            <p className="card-copy">{task.description}</p>
                                        )}

                                        <div className="kanban-task-card__actions">
                                            {/* Falls Task nicht mehr in To Do ist, kann man ihn zurückschieben */}
                                            {task.status !== "todo" && (
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={() =>
                                                        moveTask(
                                                            task,
                                                            task.status === "done"
                                                                ? "in_progress"
                                                                : "todo",
                                                        )
                                                    }
                                                >
                                                    ← Zurück
                                                </button>
                                            )}

                                            {/* Falls Task noch nicht fertig ist, kann man ihn weiterschieben */}
                                            {task.status !== "done" && (
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={() =>
                                                        moveTask(
                                                            task,
                                                            task.status === "todo"
                                                                ? "in_progress"
                                                                : "done",
                                                        )
                                                    }
                                                >
                                                    Weiter →
                                                </button>
                                            )}

                                            {/* Task löschen */}
                                            <button
                                                type="button"
                                                className="button-secondary button-secondary--danger"
                                                onClick={() => deleteTask(task.id)}
                                            >
                                                Löschen
                                            </button>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}