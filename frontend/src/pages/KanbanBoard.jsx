import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config";

// Die drei Spalten des Kanban-Boards
const columns = [
    { key: "todo", title: "To Do" },
    { key: "in_progress", title: "In Progress" },
    { key: "done", title: "Done" },
];

export default function KanbanBoard({ userId, activeHousehold }) {
    // Alle geladenen Tasks
    const [tasks, setTasks] = useState([]);

    // Mitglieder des aktiven Haushalts für Zuweisung / Anzeige
    const [members, setMembers] = useState([]);

    // Eingabefelder für neue Aufgabe
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [dueDate, setDueDate] = useState("");
    const [label, setLabel] = useState("");
    const [assignedTo, setAssignedTo] = useState("");

    // Status / Meldungen
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Bearbeiten bestehender Tasks
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPriority, setEditPriority] = useState("medium");
    const [editDueDate, setEditDueDate] = useState("");
    const [editLabel, setEditLabel] = useState("");
    const [editAssignedTo, setEditAssignedTo] = useState("");

    // Ref für die Bearbeiten-Sektion
    const editSectionRef = useRef(null);

    // Filter
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [labelFilter, setLabelFilter] = useState("");
    const [assignedFilter, setAssignedFilter] = useState("all");

    // Drag & Drop
    const [draggedTaskId, setDraggedTaskId] = useState(null);

    // Mitglieder des Haushalts laden
    const loadMembers = async () => {
        if (!userId || !activeHousehold?.id) {
            setMembers([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/kanban/${activeHousehold.id}/members?user_id=${userId}`,
            );

            if (!response.ok) {
                setMembers([]);
                return;
            }

            const data = await response.json();
            setMembers(data || []);
        } catch {
            setMembers([]);
        }
    };

    // Tasks des aktiven Haushalts laden
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

    // Neu laden, wenn User oder Haushalt wechselt
    useEffect(() => {
        loadTasks();
        loadMembers();
    }, [userId, activeHousehold?.id]);

    // Map für Anzeige von Namen statt UUID
    const memberNameMap = useMemo(() => {
        const map = {};
        members.forEach((member) => {
            map[member.user_id] = member.display_name || member.user_id;
        });
        return map;
    }, [members]);

    // Filtert Tasks vor der Anzeige
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (priorityFilter !== "all" && task.priority !== priorityFilter) {
                return false;
            }

            if (
                assignedFilter !== "all" &&
                (task.assigned_to || "") !== assignedFilter
            ) {
                return false;
            }

            if (
                labelFilter &&
                !(task.label || "").toLowerCase().includes(labelFilter.toLowerCase())
            ) {
                return false;
            }

            return true;
        });
    }, [tasks, priorityFilter, assignedFilter, labelFilter]);

    // Aufgaben nach Status in Spalten gruppieren
    const groupedTasks = useMemo(() => {
        return {
            todo: filteredTasks.filter((task) => task.status === "todo"),
            in_progress: filteredTasks.filter((task) => task.status === "in_progress"),
            done: filteredTasks.filter((task) => task.status === "done"),
        };
    }, [filteredTasks]);

    // Neue Aufgabe erstellen
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
                    priority,
                    due_date: dueDate || null,
                    label: label.trim() || null,
                    assigned_to: assignedTo || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Task konnte nicht erstellt werden.");
                return;
            }

            // Eingabefelder zurücksetzen
            setTitle("");
            setDescription("");
            setPriority("medium");
            setDueDate("");
            setLabel("");
            setAssignedTo("");

            // Filter zurücksetzen, damit neue Tasks sichtbar bleiben
            setPriorityFilter("all");
            setLabelFilter("");
            setAssignedFilter("all");

            setSuccessMessage("Task erfolgreich erstellt.");
            await loadTasks();
        } catch {
            setError("Netzwerkfehler beim Erstellen des Tasks.");
        } finally {
            setIsSaving(false);
        }
    };

    // Aufgabe in andere Spalte verschieben
    const moveTask = async (task, nextStatus) => {
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/kanban/tasks/${task.id}?user_id=${userId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: nextStatus }),
                }
            );

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

    // Aufgabe löschen
    const deleteTask = async (taskId) => {
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/kanban/tasks/${taskId}?user_id=${userId}`,
                {
                    method: "DELETE",
                }
            );

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

    // Bearbeiten starten
    const startEditTask = (task) => {
        setEditingTask(task);
        setEditTitle(task.title || "");
        setEditDescription(task.description || "");
        setEditPriority(task.priority || "medium");
        setEditDueDate(task.due_date ? task.due_date.slice(0, 16) : "");
        setEditLabel(task.label || "");
        setEditAssignedTo(task.assigned_to || "");

        // Nach dem Rendern direkt zur Bearbeiten-Sektion scrollen
        setTimeout(() => {
            editSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 50);
    };

    // Änderungen speichern
    const saveTaskEdit = async () => {
        if (!editingTask) return;

        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/kanban/tasks/${editingTask.id}?user_id=${userId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: editTitle.trim(),
                        description: editDescription.trim(),
                        priority: editPriority,
                        due_date: editDueDate || null,
                        label: editLabel.trim() || null,
                        assigned_to: editAssignedTo || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Task konnte nicht bearbeitet werden.");
                return;
            }

            setEditingTask(null);
            setEditTitle("");
            setEditDescription("");
            setEditPriority("medium");
            setEditDueDate("");
            setEditLabel("");
            setEditAssignedTo("");

            // Filter zurücksetzen, damit bearbeitete Tasks sichtbar bleiben
            setPriorityFilter("all");
            setLabelFilter("");
            setAssignedFilter("all");

            setSuccessMessage("Task aktualisiert.");
            await loadTasks();
        } catch {
            setError("Netzwerkfehler beim Bearbeiten des Tasks.");
        }
    };

    // Drag starten
    const handleDragStart = (taskId) => {
        setDraggedTaskId(taskId);
    };

    // Drop auf Zielspalte
    const handleDrop = async (columnKey) => {
        if (!draggedTaskId) return;

        const draggedTask = tasks.find((task) => task.id === draggedTaskId);
        if (!draggedTask) return;

        await moveTask(draggedTask, columnKey);
        setDraggedTaskId(null);
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

                    <select
                        className="text-input"
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                    >
                        <option value="low">Priorität: Niedrig</option>
                        <option value="medium">Priorität: Mittel</option>
                        <option value="high">Priorität: Hoch</option>
                    </select>

                    <input
                        className="text-input"
                        type="datetime-local"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                    />

                    <input
                        className="text-input"
                        type="text"
                        placeholder="Label (optional)"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                    />

                    <select
                        className="text-input"
                        value={assignedTo}
                        onChange={(event) => setAssignedTo(event.target.value)}
                    >
                        <option value="">Niemand zugewiesen</option>
                        {members.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                                {member.display_name || member.user_id}
                            </option>
                        ))}
                    </select>

                    <button className="button-primary" type="submit" disabled={isSaving}>
                        {isSaving ? "Speichern..." : "Neue Aufgabe erstellen"}
                    </button>
                </form>
            </section>

            {/* Bearbeiten */}
            {editingTask && (
                <section ref={editSectionRef} className="section-card">
                    <div className="section-card__header">
                        <div>
                            <p className="section-kicker">[Kanban]</p>
                            <h3 className="section-title">
                                Aufgabe bearbeiten: {editingTask.title}
                            </h3>
                        </div>
                    </div>

                    <div className="kanban-form">
                        <input
                            className="text-input"
                            type="text"
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                        />
                        <textarea
                            className="text-area"
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                        />

                        <select
                            className="text-input"
                            value={editPriority}
                            onChange={(event) => setEditPriority(event.target.value)}
                        >
                            <option value="low">Priorität: Niedrig</option>
                            <option value="medium">Priorität: Mittel</option>
                            <option value="high">Priorität: Hoch</option>
                        </select>

                        <input
                            className="text-input"
                            type="datetime-local"
                            value={editDueDate}
                            onChange={(event) => setEditDueDate(event.target.value)}
                        />

                        <input
                            className="text-input"
                            type="text"
                            value={editLabel}
                            onChange={(event) => setEditLabel(event.target.value)}
                            placeholder="Label"
                        />

                        <select
                            className="text-input"
                            value={editAssignedTo}
                            onChange={(event) => setEditAssignedTo(event.target.value)}
                        >
                            <option value="">Niemand zugewiesen</option>
                            {members.map((member) => (
                                <option key={member.user_id} value={member.user_id}>
                                    {member.display_name || member.user_id}
                                </option>
                            ))}
                        </select>

                        <div className="kanban-task-card__actions">
                            <button type="button" className="button-primary" onClick={saveTaskEdit}>
                                Änderungen speichern
                            </button>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={() => {
                                    setEditingTask(null);
                                    setEditTitle("");
                                    setEditDescription("");
                                    setEditPriority("medium");
                                    setEditDueDate("");
                                    setEditLabel("");
                                    setEditAssignedTo("");
                                }}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Filter */}
            <section className="section-card">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Kanban]</p>
                        <h3 className="section-title">Filter</h3>
                    </div>
                </div>

                <div className="kanban-form">
                    <select
                        className="text-input"
                        value={priorityFilter}
                        onChange={(event) => setPriorityFilter(event.target.value)}
                    >
                        <option value="all">Alle Prioritäten</option>
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                    </select>

                    <input
                        className="text-input"
                        type="text"
                        placeholder="Nach Label filtern"
                        value={labelFilter}
                        onChange={(event) => setLabelFilter(event.target.value)}
                    />

                    <select
                        className="text-input"
                        value={assignedFilter}
                        onChange={(event) => setAssignedFilter(event.target.value)}
                    >
                        <option value="all">Alle Zuweisungen</option>
                        <option value="">Nicht zugewiesen</option>
                        {members.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                                {member.display_name || member.user_id}
                            </option>
                        ))}
                    </select>
                </div>

                {(priorityFilter !== "all" || labelFilter || assignedFilter !== "all") && (
                    <p className="section-note">
                        Es sind Filter aktiv. Manche Tasks werden möglicherweise ausgeblendet.
                    </p>
                )}
            </section>

            {/* Die 3 Kanban-Spalten */}
            <section className="kanban-board">
                {columns.map((column) => (
                    <div
                        key={column.key}
                        className="kanban-column"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(column.key)}
                    >
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
                                    <article
                                        key={task.id}
                                        className="kanban-task-card"
                                        draggable
                                        onDragStart={() => handleDragStart(task.id)}
                                    >
                                        <h4>{task.title}</h4>

                                        {task.description && (
                                            <p className="card-copy">{task.description}</p>
                                        )}

                                        {task.priority && (
                                            <p className="card-copy">Priorität: {task.priority}</p>
                                        )}

                                        {task.due_date && (
                                            <p className="card-copy">
                                                Deadline: {new Date(task.due_date).toLocaleString()}
                                            </p>
                                        )}

                                        {task.label && (
                                            <p className="card-copy">Label: {task.label}</p>
                                        )}

                                        {task.assigned_to && (
                                            <p className="card-copy">
                                                Zugewiesen: {memberNameMap[task.assigned_to] || task.assigned_to}
                                            </p>
                                        )}

                                        <div className="kanban-task-card__actions">
                                            <button
                                                type="button"
                                                className="button-secondary"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    startEditTask(task);
                                                }}
                                                onMouseDown={(event) => {
                                                    event.stopPropagation();
                                                }}
                                            >
                                                Bearbeiten
                                            </button>

                                            {task.status !== "todo" && (
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        moveTask(
                                                            task,
                                                            task.status === "done"
                                                                ? "in_progress"
                                                                : "todo",
                                                        );
                                                    }}
                                                    onMouseDown={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                >
                                                    ← Zurück
                                                </button>
                                            )}

                                            {task.status !== "done" && (
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        moveTask(
                                                            task,
                                                            task.status === "todo"
                                                                ? "in_progress"
                                                                : "done",
                                                        );
                                                    }}
                                                    onMouseDown={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                >
                                                    Weiter →
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="button-secondary button-secondary--danger"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    deleteTask(task.id);
                                                }}
                                                onMouseDown={(event) => {
                                                    event.stopPropagation();
                                                }}
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