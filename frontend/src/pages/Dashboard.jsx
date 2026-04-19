import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { API_URL } from "../config";
import HouseholdsSection from "../components/HouseholdsSection";

const modules = [
    {
        prefix: "[Kanban]",
        title: "Aufgaben & Planung",
        description: "Aufgaben gemeinsam strukturieren, priorisieren und spaeter im Board verwalten.",
        to: "/kanban",
    },
    {
        prefix: "[Einkauf/Vorrat]",
        title: "Einkauf & Vorrat",
        description: "Einkaufslisten und Vorratslogik als gemeinsamer Haushaltsbereich vorbereiten.",
        to: null,
    },
    {
        prefix: "[Kalender]",
        title: "Kalender & Termine",
        description: "Gemeinsame Termine sichtbar machen und spaeter mit Kalenderlogik erweitern.",
        to: null,
    },
];

export default function Dashboard({
    userId,
    households,
    activeHousehold,
    setActiveHousehold,
    refreshHouseholds,
}) {
    const [userName, setUserName] = useState("");
    useEffect(() => {
        if (!userId) {
            setUserName("");
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/profile/${userId}`);
                const data = await response.json();
                if (response.ok) {
                    setUserName(data.display_name);
                }
            } catch {
                setUserName("");
            }
        };

        fetchProfile();
    }, [userId]);

    return (
        <div className="stack-layout">
            <HouseholdsSection
                userId={userId}
                households={households}
                activeHousehold={activeHousehold}
                refreshHouseholds={refreshHouseholds}
                setActiveHousehold={setActiveHousehold}
            />

            <section className="section-card">
                <div className="section-card__header">
                    <div>
                        <p className="section-kicker">[Core]</p>
                        <h3 className="section-title">Module</h3>
                    </div>
                    <p className="section-note">
                        Diese drei Bereiche bilden die fachlichen Hauptteile der App und bekommen spaeter ihre eigenen Ansichten.
                    </p>
                </div>

                <section className="grid">
                    {modules.map((module) =>
                        module.to ? (
                            <Link key={module.prefix} to={module.to} className="card card--module card--link">
                                <p className="section-kicker">{module.prefix}</p>
                                <h3>{module.title}</h3>
                                <p className="card-copy">{module.description}</p>
                            </Link>
                        ) : (
                            <article key={module.prefix} className="card card--module">
                                <p className="section-kicker">{module.prefix}</p>
                                <h3>{module.title}</h3>
                                <p className="card-copy">{module.description}</p>
                            </article>
                        ),
                    )}
                </section>
            </section>
        </div>
    );
}
