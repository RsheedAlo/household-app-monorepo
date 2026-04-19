import { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";

import { API_URL } from "./config";
import Dashboard from "./pages/Dashboard";
import HouseholdSettings from "./pages/HouseholdSettings";
import HouseholdsOverview from "./pages/HouseholdsOverview";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import KanbanBoard from "./pages/KanbanBoard";

export default function App() {
    const [userId, setUserId] = useState(localStorage.getItem("userId") || null);
    const [households, setHouseholds] = useState([]);
    const [activeHousehold, setActiveHousehold] = useState(
        JSON.parse(localStorage.getItem("activeHousehold")) || null,
    );
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (userId) {
            localStorage.setItem("userId", userId);
            loadHouseholds(userId);
        } else {
            localStorage.removeItem("userId");
            setHouseholds([]);
            setActiveHousehold(null);
        }
    }, [userId]);

    useEffect(() => {
        if (activeHousehold) {
            localStorage.setItem("activeHousehold", JSON.stringify(activeHousehold));
        } else {
            localStorage.removeItem("activeHousehold");
        }
    }, [activeHousehold]);

    useEffect(() => {
        const run = async () => {
            if (!userId) {
                setNotificationCount(0);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/households/invites/user/${userId}`);
                const data = await response.json();
                if (response.ok) {
                    setNotificationCount(data.length);
                } else {
                    setNotificationCount(0);
                }
            } catch {
                setNotificationCount(0);
            }
        };

        run();
    }, [userId]);

    const loadHouseholds = async (id) => {
        try {
            const response = await fetch(`${API_URL}/households/user/${id}`);
            if (response.ok) {
                const data = await response.json();
                setHouseholds(data);

                if (data.length > 0 && !activeHousehold) {
                    setActiveHousehold(data[0]);
                }
            }
        } catch (error) {
            console.error("Fehler beim Laden der Haushalte", error);
        }
    };

    return (
        <Router>
            <div className="app-frame">
                <header className="topbar">
                    <div className="topbar__brand">
                        <Link to="/" className="brand-link">
                            Household App
                        </Link>
                        <p className="brand-subtitle">Gemeinsame Haushalte klar verwalten.</p>
                    </div>

                    <nav className="topbar__nav" aria-label="Hauptnavigation">
                        {userId ? (
                            <>
                                <Link to="/" className="nav-link">
                                    Dashboard
                                </Link>
                                <Link to="/households" className="nav-link">
                                    Haushalte
                                </Link>
                                <Link to="/settings" className="nav-link nav-link--primary">
                                    Verwalten
                                </Link>
                                <Link to="/notifications" className="nav-link nav-link--inbox" title="Benachrichtigungen">
                                    <span className="bell-icon" aria-hidden="true">🔔</span>
                                    {notificationCount > 0 && <span className="nav-dot" aria-hidden="true" />}
                                </Link>
                                <button type="button" onClick={() => setUserId(null)} className="nav-link nav-link--ghost">
                                    Abmelden
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/" className="nav-link">
                                    Start
                                </Link>
                                <Link to="/login" className="nav-link nav-link--primary">
                                    Anmelden
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="page-shell">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Dashboard
                                    userId={userId}
                                    households={households}
                                    activeHousehold={activeHousehold}
                                    setActiveHousehold={setActiveHousehold}
                                    refreshHouseholds={loadHouseholds}
                                />
                            }
                        />
                        <Route
                            path="/notifications"
                            element={
                                <Notifications
                                    userId={userId}
                                    refreshHouseholds={loadHouseholds}
                                    setNotificationCount={setNotificationCount}
                                />
                            }
                        />
                        <Route path="/login" element={<Login setUserId={setUserId} />} />
                        <Route path="/register" element={<Register setUserId={setUserId} />} />
                        <Route
                            path="/settings"
                            element={
                                <HouseholdSettings
                                    userId={userId}
                                    activeHousehold={activeHousehold}
                                    households={households}
                                    refreshHouseholds={loadHouseholds}
                                    setActiveHousehold={setActiveHousehold}
                                />
                            }
                        />
                        <Route
                            path="/households"
                            element={
                                <HouseholdsOverview
                                    userId={userId}
                                    households={households}
                                    activeHousehold={activeHousehold}
                                    refreshHouseholds={loadHouseholds}
                                    setActiveHousehold={setActiveHousehold}
                                />
                            }
                        />
                        <Route
                            path="/kanban"
                            element={
                                <KanbanBoard
                                    userId={userId}
                                    activeHousehold={activeHousehold}
                                />
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}
