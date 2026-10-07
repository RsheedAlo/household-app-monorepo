import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowUpRight,
    CalendarDots,
    House,
    Kanban,
    ShoppingCartSimple,
    SignIn,
    UserPlus,
} from "@phosphor-icons/react";

import { API_URL } from "../config";
import HouseholdsSection from "../components/HouseholdsSection";
import { EmptyHome } from "../components/art/EmptyArt";
import HeroShapes from "../components/art/HeroShapes";
import { BasketScene, CalendarTileArt, ShopTileArt, TasksTileArt } from "../components/art/Scenes";
import { Leaf, Lemon, Tomato } from "../components/art/Stickers";
import usePointerParallax from "../hooks/usePointerParallax";
import { plural, quantityLabel } from "../lib/shoppingFormat";
import "../theme/fonts";
import "../theme/home-theme.css";
import "./Dashboard.css";

function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) {
        return "Guten Morgen";
    }
    return hour < 18 ? "Guten Tag" : "Guten Abend";
}

// Liest die Zahlen für das Dashboard aus der Einkauf/Vorrat-API (nur lesen, bei Fehler still)
function useShoppingSummary(token, householdId) {
    const [summary, setSummary] = useState({ state: "idle", planned: [], stock: 0 });

    useEffect(() => {
        if (!token || !householdId) {
            setSummary({ state: "idle", planned: [], stock: 0 });
            return undefined;
        }

        let cancelled = false;
        setSummary({ state: "loading", planned: [], stock: 0 });

        fetch(`${API_URL}/api/shopping/${householdId}/items`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load"))))
            .then((items) => {
                if (!cancelled) {
                    setSummary({
                        state: "ready",
                        planned: items.filter((item) => item.status === "planned"),
                        stock: items.filter((item) => item.status === "in_stock").length,
                    });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSummary({ state: "error", planned: [], stock: 0 });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [token, householdId]);

    return summary;
}

function heroLead({ isLoggedIn, hasHousehold, summary }) {
    if (!isLoggedIn) {
        return "Einkaufsliste, Vorrat, Aufgaben und Termine für alle, die bei dir wohnen.";
    }
    if (!hasHousehold) {
        return "Lege deinen Haushalt an und lade die anderen ein. Dann kann es losgehen.";
    }
    if (summary.state === "ready") {
        const toBuy = summary.planned.length;
        const stock = `im Vorrat ${plural(summary.stock, "liegt", "liegen")} ${summary.stock}`;
        if (toBuy === 0) {
            return `Die Einkaufsliste ist leer, ${stock}.`;
        }
        return `Auf der Einkaufsliste ${plural(toBuy, "steht", "stehen")} ${toBuy} Artikel, ${stock}.`;
    }
    return "Einkauf, Aufgaben und Termine eures Haushalts an einem Ort.";
}

function Tile({ to, className, Art, Icon, title, delay, children }) {
    return (
        <Link to={to} className={`dash-tile ${className} dash-rise`} style={{ "--delay": delay }}>
            <Art className="dash-tile__art" />
            <span className="dash-tile__go" aria-hidden="true">
                <ArrowUpRight weight="bold" />
            </span>
            <div className="dash-tile__body">
                <span className="dash-tile__icon" aria-hidden="true">
                    <Icon weight="duotone" />
                </span>
                <h2 className="dash-tile__title">{title}</h2>
                {children}
            </div>
        </Link>
    );
}

export default function Dashboard({
    userId,
    token,
    households,
    activeHousehold,
    setActiveHousehold,
    refreshHouseholds,
}) {
    const [userName, setUserName] = useState("");
    const heroRef = useRef(null);
    usePointerParallax(heroRef);

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

    const isLoggedIn = Boolean(userId);
    const hasHousehold = Boolean(activeHousehold?.id);
    const summary = useShoppingSummary(token, activeHousehold?.id);
    const preview = summary.planned.slice(0, 3);
    const showCard = isLoggedIn && hasHousehold && ["loading", "ready"].includes(summary.state);

    return (
        <div className="dash">
            <section ref={heroRef} className="dash-hero" aria-labelledby="dash-title">
                <HeroShapes />

                <div className="dash-hero__copy">
                    {isLoggedIn && (
                        <p className="dash-chip dash-rise" style={{ "--delay": "0ms" }}>
                            <House weight="fill" aria-hidden="true" />
                            <span>{hasHousehold ? activeHousehold.name : "Noch kein Haushalt"}</span>
                        </p>
                    )}

                    <h1 id="dash-title" className="dash-hero__title dash-rise" style={{ "--delay": "70ms" }}>
                        {isLoggedIn ? (
                            <>
                                {greeting()}
                                {userName && (
                                    <>
                                        , <span className="dash-hero__name">{userName}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            "Dein Zuhause, gemeinsam organisiert"
                        )}
                    </h1>

                    <p className="dash-hero__lead dash-rise" style={{ "--delay": "140ms" }}>
                        {heroLead({ isLoggedIn, hasHousehold, summary })}
                    </p>

                    <div className="dash-hero__actions dash-rise" style={{ "--delay": "210ms" }}>
                        {!isLoggedIn && (
                            <>
                                <Link className="dash-btn dash-btn--light" to="/login">
                                    <SignIn weight="bold" aria-hidden="true" />
                                    Anmelden
                                </Link>
                                <Link className="dash-btn dash-btn--ghost" to="/register">
                                    <UserPlus weight="bold" aria-hidden="true" />
                                    Konto erstellen
                                </Link>
                            </>
                        )}
                        {isLoggedIn && !hasHousehold && (
                            <a className="dash-btn dash-btn--light" href="#haushalte">
                                <House weight="bold" aria-hidden="true" />
                                Haushalt erstellen
                            </a>
                        )}
                        {isLoggedIn && hasHousehold && (
                            <>
                                <Link className="dash-btn dash-btn--light" to="/shopping">
                                    <ShoppingCartSimple weight="bold" aria-hidden="true" />
                                    Einkaufsliste öffnen
                                </Link>
                                <Link className="dash-btn dash-btn--ghost" to="/calendar">
                                    <CalendarDots weight="bold" aria-hidden="true" />
                                    Termine ansehen
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="dash-hero__art">
                    <div className="dash-par" style={{ "--depth": 8 }}>
                        <BasketScene className="dash-scene dash-pop" style={{ "--delay": "160ms" }} />
                    </div>

                    <div className="dash-par dash-par--tomato" style={{ "--depth": 24 }}>
                        <Tomato className="dash-sticker dash-pop" style={{ "--delay": "420ms" }} />
                    </div>
                    <div className="dash-par dash-par--leaf" style={{ "--depth": 30 }}>
                        <Leaf className="dash-sticker dash-pop" style={{ "--delay": "500ms" }} />
                    </div>
                    <div className="dash-par dash-par--lemon" style={{ "--depth": 18 }}>
                        <Lemon className="dash-sticker dash-pop" style={{ "--delay": "580ms" }} />
                    </div>

                    {showCard && (
                        <div className="dash-par dash-par--card" style={{ "--depth": 14 }}>
                            <aside className="dash-card dash-pop" style={{ "--delay": "340ms" }} aria-label="Vorschau Einkaufsliste">
                                <div className="dash-card__head">
                                    <ShoppingCartSimple weight="fill" aria-hidden="true" />
                                    <strong>Zu kaufen</strong>
                                    {summary.state === "ready" && (
                                        <span className="dash-card__count">{summary.planned.length}</span>
                                    )}
                                </div>

                                {summary.state === "loading" && (
                                    <div className="dash-card__skeleton" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                )}

                                {summary.state === "ready" && preview.length > 0 && (
                                    <ul>
                                        {preview.map((item, index) => (
                                            <li key={item.id} style={{ "--i": index }}>
                                                <span>{item.name}</span>
                                                {quantityLabel(item) && <span>{quantityLabel(item)}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {summary.state === "ready" && preview.length === 0 && (
                                    <p className="dash-card__empty">Nichts zu kaufen. Gut gemacht!</p>
                                )}
                            </aside>
                        </div>
                    )}
                </div>
            </section>

            <section className="dash-grid" aria-label="Module">
                <Tile
                    to="/shopping"
                    className="dash-tile--shop"
                    Art={ShopTileArt}
                    Icon={ShoppingCartSimple}
                    title="Einkauf & Vorrat"
                    delay="240ms"
                >
                    <p className="dash-tile__text">
                        Gemeinsame Einkaufsliste, abhaken im Laden und den Vorrat im Blick behalten.
                    </p>
                    {summary.state === "ready" && (
                        <>
                            {preview.length > 0 && (
                                <ul className="dash-tile__live">
                                    {preview.map((item) => (
                                        <li key={item.id}>
                                            <span>{item.name}</span>
                                            {quantityLabel(item) && <span>{quantityLabel(item)}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="dash-tile__meta">
                                {summary.planned.length} zu kaufen · {summary.stock} im Vorrat
                            </p>
                        </>
                    )}
                </Tile>

                <Tile
                    to="/kanban"
                    className="dash-tile--tasks"
                    Art={TasksTileArt}
                    Icon={Kanban}
                    title="Aufgaben & Planung"
                    delay="320ms"
                >
                    <p className="dash-tile__text">
                        Wer macht was? Aufgaben im Board von To Do bis Erledigt verschieben.
                    </p>
                </Tile>

                <Tile
                    to="/calendar"
                    className="dash-tile--calendar"
                    Art={CalendarTileArt}
                    Icon={CalendarDots}
                    title="Kalender & Termine"
                    delay="400ms"
                >
                    <p className="dash-tile__text">
                        Gemeinsame Termine mit Erinnerung und Export in deinen Kalender.
                    </p>
                </Tile>
            </section>

            <section className="dash-households" id="haushalte" aria-label="Haushalte">
                {isLoggedIn ? (
                    <HouseholdsSection
                        userId={userId}
                        households={households}
                        activeHousehold={activeHousehold}
                        refreshHouseholds={refreshHouseholds}
                        setActiveHousehold={setActiveHousehold}
                    />
                ) : (
                    <div className="dash-panel">
                        <EmptyHome className="dash-panel__art" />
                        <div className="dash-panel__copy">
                            <h2>Melde dich an</h2>
                            <p>
                                Mit einem Konto siehst du deine Haushalte, legst neue an und lädst die anderen
                                ein.
                            </p>
                            <div className="dash-panel__actions">
                                <Link className="dash-btn dash-btn--solid" to="/login">
                                    Anmelden
                                </Link>
                                <Link className="dash-btn dash-btn--outline" to="/register">
                                    Konto erstellen
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
