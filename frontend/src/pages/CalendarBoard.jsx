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

export default function CalendarBoard({ userId, activeHousehold }) {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");

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

    const handleSelectEvent = (event) => {
        //TODO: Termin Detail View
        alert(`Termin geklickt: ${event.title}\nBeschreibung: ${event.resource.description || "Keine"}`);
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

                <div style={{ height: "600px", marginTop: "20px" }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        culture="de"
                        messages={{
                            next: "Weiter",
                            previous: "Zurück",
                            today: "Heute",
                            month: "Monat",
                            week: "Woche",
                            day: "Tag",
                            agenda: "Agenda",
                            noEventsInRange: "Keine Termine in diesem Zeitraum."
                        }}
                        onSelectEvent={handleSelectEvent}
                        style={{ height: "100%", fontFamily: "inherit" }}
                    />
                </div>
            </section>
        </div>
    );
}