import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

const columns = [
    { key: "todo", title: "To Do" },
    { key: "in_progress", title: "In Progress" },
    { key: "done", title: "Done" },
];

export default function KanbanBoard({ userId, activeHousehold }) {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const groupedTasks = useMemo(() => {
        return {
            todo: tasks.filter((task) => task.status === "todo"),
            in_progress: tasks.filter((task) => task.status === "in_progress"),
            done: tasks.filter((task) => task.status === "done"),
        };
    }, [tasks]);

    const loadTasks = async () => {
        if (!userId || !activeHousehold?.id) {
            setTasks([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/kanban/${activeHousehold.id}/tasks?user_id=${userId}`,
            );
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Tasks konnten nicht geladen werden.");
                return;
            }

            setTasks(data);
        } catch {
            setError("Netzwerkfehler beim Laden der Tasks.");
        }
    };

    useEffect(() => {
        loadTasks();
    }, [userId, activeHousehold?.id]);

    const handleCreateTask = async (event) => {
        event.preventDefault();
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
                    status: "todo",
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.detail || "Task konnte nicht erstellt werden.");
                return;
            }

            setTitle("");
            setDescription("");
            setSuccessMessage("Task erfolgreich erstellt.");
            await loadTasks();
        } catch {
            setError("Netzwerkfehler beim Erstellen des Tasks.");
        } finally {
            setIsSaving(false);
        }
    };

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

    if (!userId) {
        return (
            <section className="section-card">
                <p className="section-empty">Bitte zuerst anmelden, um das Kanban-Board zu nutzen.</p>
            </section>
        );
    }

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
                                        {task.description && (
                                            <p className="card-copy">{task.description}</p>
                                        )}

                                        <div className="kanban-task-card__actions">
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