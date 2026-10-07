import { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, NavLink, Route, Routes } from "react-router-dom";
import { Bell, GearSix, House, SignIn, SignOut, SquaresFour, UsersThree } from "@phosphor-icons/react";

import { API_URL } from "./config";
import Dashboard from "./pages/Dashboard";
import HouseholdSettings from "./pages/HouseholdSettings";
import HouseholdsOverview from "./pages/HouseholdsOverview";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import KanbanBoard from "./pages/KanbanBoard";
import CalendarBoard from "./pages/CalendarBoard";
import ShoppingBoard from "./pages/ShoppingBoard";
import "./theme/fonts";
import "./theme/topbar.css";

export default function App() {
    const [userId, setUserId] = useState(localStorage.getItem("userId") || null);
    const [households, setHouseholds] = useState([]);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [activeHousehold, setActiveHousehold] = useState(
        JSON.parse(localStorage.getItem("activeHousehold")) || null,
    );
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (userId && token) {
            localStorage.setItem("userId", userId);
            localStorage.setItem("token", token);
            loadHouseholds(userId);
        } else {
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
            setHouseholds([]);
            setActiveHousehold(null);
        }
    }, [userId, token]);

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
                <header className="hh-bar">
                    <div className="hh-bar__inner">
                        <Link to="/" className="hh-brand" aria-label="Household App, zur Startseite">
                            <span className="hh-brand__mark" aria-hidden="true">
                                <House weight="fill" />
                            </span>
                            <span className="hh-brand__name">Household</span>
                        </Link>

                        <nav className="hh-nav" aria-label="Hauptnavigation">
                            {userId ? (
                                <>
                                    <NavLink to="/" end className="hh-nav__link hh-nav__link--icon-only-sm">
                                        <SquaresFour weight="bold" aria-hidden="true" />
                                        <span className="hh-nav__label--sm-hide">Dashboard</span>
                                    </NavLink>
                                    <NavLink to="/households" className="hh-nav__link hh-nav__link--icon-only-sm">
                                        <UsersThree weight="bold" aria-hidden="true" />
                                        <span className="hh-nav__label--sm-hide">Haushalte</span>
                                    </NavLink>
                                    <NavLink to="/settings" className="hh-nav__link hh-nav__link--icon-only-sm">
                                        <GearSix weight="bold" aria-hidden="true" />
                                        <span className="hh-nav__label--sm-hide">Verwalten</span>
                                    </NavLink>
                                    <NavLink
                                        to="/notifications"
                                        className="hh-nav__link hh-nav__link--icon-only-sm"
                                        title="Benachrichtigungen"
                                    >
                                        <Bell weight="bold" aria-hidden="true" />
                                        <span className="hh-nav__label--sm-hide">Benachrichtigungen</span>
                                        {notificationCount > 0 && <span className="hh-nav__dot" aria-hidden="true" />}
                                    </NavLink>
                                    <button
                                        type="button"
                                        onClick={() => setUserId(null)}
                                        className="hh-nav__link hh-nav__link--icon-only-sm"
                                    >
                                        <SignOut weight="bold" aria-hidden="true" />
                                        <span className="hh-nav__label--sm-hide">Abmelden</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/" end className="hh-nav__link">
                                        Start
                                    </NavLink>
                                    <NavLink to="/login" className="hh-nav__link hh-nav__link--cta">
                                        <SignIn weight="bold" aria-hidden="true" />
                                        Anmelden
                                    </NavLink>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="page-shell">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Dashboard
                                    userId={userId}
                                    token={token}
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
                        <Route path="/login" element={<Login setUserId={setUserId} setToken={setToken} />} />
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
                        <Route
                            path="/calendar"
                            element={
                                <CalendarBoard
                                    userId={userId}
                                    activeHousehold={activeHousehold}
                                    token={token}
                                />
                            }
                        />
                        <Route
                            path="/shopping"
                            element={
                                <ShoppingBoard
                                    userId={userId}
                                    activeHousehold={activeHousehold}
                                    token={token}
                                />
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}
