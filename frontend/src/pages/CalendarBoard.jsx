import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import de from "date-fns/locale/de";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { API_URL } from "../config";

const locales = {
    "de": de,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const getDateString = (date) => {
    if (!date) return "";
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 10); // Gibt YYYY-MM-DD
};

const getTimeString = (date) => {
    if (!date) return "";
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(11, 16); // Gibt HH:mm
};

const updateDatePart = (originalDate, newDateString) => {
    if (!newDateString) return originalDate;
    const timeString = getTimeString(originalDate) || "00:00";
    return new Date(`${newDateString}T${timeString}`);
};

const updateTimePart = (originalDate, newTimeString) => {
    if (!newTimeString) return originalDate;
    const dateString = getDateString(originalDate) || new Date().toISOString().slice(0, 10);
    return new Date(`${dateString}T${newTimeString}`);
};

const EVENT_COLORS = [
    "#3b82f6", // Blau
    "#ef4444", // Rot
    "#10b981", // Smaragdgrün
    "#f59e0b", // Bernstein / Gelb-Orange
    "#8b5cf6", // Violett
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316"  // Orange
];

const getColorForUser = (userId) => {
    if (!userId) return "#94a3b8"; // Grau als Standard

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % EVENT_COLORS.length;
    return EVENT_COLORS[index];
};

export default function CalendarBoard({ userId, activeHousehold }) {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedEventId, setSelectedEventId] = useState(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [notifiedEvents, setNotifiedEvents] = useState(new Set());

    const loadEvents = async () => {
        if (!userId || !activeHousehold?.id) {
            setEvents([]);
            return;
        }

        try {
            //TODO:
            // Optional:start_date und end_date mitgeben, um nur aktuel. Monat zu laden
            const response = await fetch(
                `${API_URL}/api/calender/households/${activeHousehold.id}/events`,
                {
                    headers: {
                        "Authorization": `Bearer ${userId}`
                    }
                }
            );
            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Termine konnten nicht geladen werden.");
                return;
            }

            // react-big-calendar erwartet echte JavaScript Date-Objekte
            const formattedEvents = data.map(event => ({
                id: event.id,
                title: event.title,
                start: new Date(event.start_time),
                end: new Date(event.end_time),
                resource: event
            }));

            setEvents(formattedEvents);
        } catch {
            setError("Netzwerkfehler beim Laden der Termine.");
        }
    };

    useEffect(() => {
        loadEvents();
    }, [userId, activeHousehold?.id]);

    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!events || events.length === 0) return;

        const checkReminders = setInterval(() => {
            const now = new Date();
            const upcomingThreshold = new Date(now.getTime() + 15 * 60000);

            events.forEach(event => {
                const eventStart = new Date(event.start);

                if (eventStart > now && eventStart <= upcomingThreshold) {
                    if (!notifiedEvents.has(event.id)) {

                        if (Notification.permission === "granted") {
                            new Notification(`Bald: ${event.title}`, {
                                body: `Termin startet um ${eventStart.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' })} Uhr.`,
                            });
                        }

                        setNotifiedEvents(prev => new Set(prev).add(event.id));
                    }
                }
            });
        }, 60000);

        return () => clearInterval(checkReminders);
    }, [events, notifiedEvents]);

    const eventStyleGetter = (event) => {
        const creatorId = event.resource?.created_by;
        const backgroundColor = getColorForUser(creatorId);

        return {
            style: {
                backgroundColor: backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block'
            }
        };
    };

    const handleExportIcal = () => {
        if (!activeHousehold?.id) return;
        const url = `${API_URL}/api/calender/households/${activeHousehold.id}/export?user_id=${userId}`;
        window.open(url, "_blank");
    };

    const handleSelectSlot = ({ start, end }) => {
        setModalMode("create");
        setStartDate(start);
        setEndDate(end);
        setTitle("");
        setDescription("");
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        setModalMode("edit");
        setSelectedEventId(event.id);
        setStartDate(event.start);
        setEndDate(event.end);
        setTitle(event.title);
        setDescription(event.resource.description || "");
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSaving(true);
        setError("");

        const eventData = {
            title: title.trim(),
            description: description.trim(),
            start_time: startDate.toISOString(), // Backend erwartet ISO-Strings
            end_time: endDate.toISOString(),
        };

        try {
            let url = `${API_URL}/api/calender/households/${activeHousehold.id}/events?user_id=${userId}`;
            let method = "POST";

            if (modalMode === "edit") {
                url = `${API_URL}/api/calender/events/${selectedEventId}`;
                method = "PUT";
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                setIsModalOpen(false);
                await loadEvents();
            } else {
                const data = await response.json();
                setError(data.detail || "Fehler beim Speichern.");
            }
        } catch {
            setError("Netzwerkfehler beim Speichern.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Termin wirklich löschen?")) return;

        try {
            const response = await fetch(`${API_URL}/api/calender/events/${selectedEventId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setIsModalOpen(false);
                await loadEvents();
            } else {
                setError("Fehler beim Löschen.");
            }
        } catch {
            setError("Netzwerkfehler beim Löschen.");
        }
    };

    if (!userId) {
        return (
            <section className="section-card">
                <p className="section-empty">Bitte zuerst anmelden, um den Kalender zu nutzen.</p>
            </section>
        );
    }

    if (!activeHousehold?.id) {
        return (
            <section className="section-card">
                <p className="section-empty">Bitte zuerst einen aktiven Haushalt auswählen.</p>
            </section>
        );
    }

    return (
        <div className="stack-layout">
            <section className="section-card section-card--accent">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Kalender]</p>
                        <h2 className="section-title">Termine & Planung</h2>
                    </div>
                    <p className="section-note">
                        Aktiver Haushalt: <strong>{activeHousehold.name}</strong>
                    </p>
                </div>

                {error && <p className="message-banner message-banner--error">{error}</p>}

                <button type="button" className="button-secondary" onClick={handleExportIcal}>
                    .ical Exportieren
                </button>

                <div style={{ height: "600px", marginTop: "20px" }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        culture="de"
                        selectable={true}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        messages={{
                            next: "Weiter", previous: "Zurück", today: "Heute",
                            month: "Monat", week: "Woche", day: "Tag", agenda: "Agenda"
                        }}
                    />
                </div>
            </section>
            {isModalOpen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
                    justifyContent: "center", alignItems: "center", zIndex: 1000
                }}>
                    <div className="section-card" style={{ width: "100%", maxWidth: "400px", backgroundColor: "white" }}>
                        <h3>{modalMode === "create" ? "Neuer Termin" : "Termin bearbeiten"}</h3>

                        <p className="section-note" style={{ marginBottom: "15px" }}>
                            {startDate?.toLocaleDateString("de-DE")} bis {endDate?.toLocaleDateString("de-DE")}
                        </p>

                        <form onSubmit={handleSave} className="kanban-form">
                            <input
                                type="text"
                                className="text-input"
                                placeholder="Titel des Termins"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 2, minWidth: 0 }}>
                                        <label className="section-note" style={{ display: "block", marginBottom: "5px" }}>Startdatum</label>
                                        <input
                                            type="date"
                                            className="text-input"
                                            style={{ width: "100%", boxSizing: "border-box" }}
                                            value={getDateString(startDate)}
                                            onChange={(e) => setStartDate(updateDatePart(startDate, e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label className="section-note" style={{ display: "block", marginBottom: "5px" }}>Zeit</label>
                                        <input
                                            type="time"
                                            className="text-input"
                                            style={{ width: "100%", boxSizing: "border-box" }}
                                            value={getTimeString(startDate)}
                                            onChange={(e) => setStartDate(updateTimePart(startDate, e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 2, minWidth: 0 }}>
                                        <label className="section-note" style={{ display: "block", marginBottom: "5px" }}>Enddatum</label>
                                        <input
                                            type="date"
                                            className="text-input"
                                            style={{ width: "100%", boxSizing: "border-box" }}
                                            value={getDateString(endDate)}
                                            onChange={(e) => setEndDate(updateDatePart(endDate, e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label className="section-note" style={{ display: "block", marginBottom: "5px" }}>Zeit</label>
                                        <input
                                            type="time"
                                            className="text-input"
                                            style={{ width: "100%", boxSizing: "border-box" }}
                                            value={getTimeString(endDate)}
                                            onChange={(e) => setEndDate(updateTimePart(endDate, e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <textarea
                                className="text-area"
                                placeholder="Beschreibung (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ marginTop: "15px" }}
                            />

                            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                <button type="submit" className="button-primary" disabled={isSaving}>
                                    {isSaving ? "Speichert..." : "Speichern"}
                                </button>

                                {modalMode === "edit" && (
                                    <button type="button" className="button-secondary button-secondary--danger" onClick={handleDelete}>
                                        Löschen
                                    </button>
                                )}

                                <button type="button" className="button-secondary" onClick={() => setIsModalOpen(false)}>
                                    Abbrechen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}