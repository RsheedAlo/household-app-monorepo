import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowCounterClockwise,
    Check,
    CheckCircle,
    House,
    ListChecks,
    Package,
    PencilSimple,
    Plus,
    ShoppingCartSimple,
    Trash,
} from "@phosphor-icons/react";

import { API_URL } from "../config";
import { EmptyBasket, EmptyShelf } from "../components/art/EmptyArt";
import useFlip from "../hooks/useFlip";
import { formatNumber, quantityLabel } from "../lib/shoppingFormat";
import "../theme/fonts";
import "../theme/home-theme.css";
import "./ShoppingBoard.css";

const EMPTY_DRAFT = { name: "", quantity: "1", unit: "" };
const UNIT_SUGGESTIONS = ["Stk", "Pkg", "kg", "g", "l", "ml"];
const MAX_QUANTITY = 9999.99;
const DAY_MS = 24 * 60 * 60 * 1000;
const CONFETTI_COLORS = ["#059669", "#ffc83d", "#f26b4b", "#1d4ed8", "#34d399"];

// Aktionen pro Status für Artikel im Vorrat und für aufgebrauchte Artikel.
// Die erste Aktion ist die übliche und wird hervorgehoben.
const STATUS_ACTIONS = {
    in_stock: [{ label: "Aufgebraucht", next: "used_up", Icon: CheckCircle }],
    used_up: [
        { label: "Nachkaufen", next: "planned", Icon: ShoppingCartSimple },
        { label: "Rückgängig", next: "in_stock", Icon: ArrowCounterClockwise },
    ],
};

const relativeTime = new Intl.RelativeTimeFormat("de", { numeric: "auto" });

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Kurzes Vibrieren als Bestätigung (nur auf Geräten, die das können)
function vibrate(milliseconds) {
    try {
        navigator.vibrate?.(milliseconds);
    } catch {
        // egal: reine Zugabe
    }
}

// Leer heißt 1, sonst muss die Menge im erlaubten Bereich liegen
function parseQuantity(text) {
    if (text.trim() === "") {
        return 1;
    }
    const value = Number(text);
    return Number.isFinite(value) && value > 0 && value <= MAX_QUANTITY ? value : null;
}

// "heute", "gestern", "vor 3 Tagen" (nach Kalendertagen, nicht nach 24-Stunden-Blöcken)
function daysAgo(isoDate) {
    const startOfDay = (date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(isoDate))) / DAY_MS);
    return relativeTime.format(-Math.max(days, 0), "day");
}

// Kleiner Hinweis unter dem Namen, der den Verbrauch sichtbar macht
function itemHint(item) {
    if (item.status === "in_stock" && item.bought_at) {
        return `gekauft ${daysAgo(item.bought_at)}`;
    }
    if (item.status === "used_up" && item.used_up_at) {
        return `aufgebraucht ${daysAgo(item.used_up_at)}`;
    }
    if (item.status === "planned" && item.used_up_at) {
        return `zuletzt aufgebraucht ${daysAgo(item.used_up_at)}`;
    }
    return "";
}

function describeError(status, data) {
    if (status === 401) {
        return "Deine Sitzung ist abgelaufen. Bitte melde dich neu an.";
    }
    if (status === 403 || status === 404) {
        return "Dieser Artikel oder Haushalt ist nicht mehr verfügbar. Lade die Seite neu.";
    }
    if (status === 409) {
        return "Jemand hat diesen Artikel gerade geändert. Die Liste wurde aktualisiert.";
    }
    if (status === 422) {
        return "Bitte prüfe deine Eingabe: Der Name braucht 1 bis 120 Zeichen, die Menge muss größer als 0 sein.";
    }
    if (typeof data?.detail === "string") {
        return data.detail;
    }
    return "Das hat nicht geklappt. Versuche es gleich noch einmal.";
}

// Einheitlicher Aufruf der Einkauf/Vorrat-API mit Bearer-Token.
// Fehler tragen den HTTP-Status, damit die Seite z. B. bei 409 neu laden kann.
async function request(token, path, options = {}) {
    let response;
    try {
        response = await fetch(`${API_URL}/api/shopping${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
    } catch {
        throw new Error("Keine Verbindung zum Server. Prüfe deine Verbindung und versuche es erneut.");
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw Object.assign(new Error(describeError(response.status, data)), {
            status: response.status,
        });
    }
    return data;
}

// Artikel gleitet beim Löschen kurz zur Seite, bevor er aus der Liste verschwindet
function playExit(id) {
    const element = document.querySelector(`[data-flip-id="${CSS.escape(id)}"]`);
    if (!element || prefersReducedMotion()) {
        return Promise.resolve();
    }
    return element
        .animate(
            [
                { opacity: 1, transform: "none" },
                { opacity: 0, transform: "translateX(28px)" },
            ],
            { duration: 170, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
        )
        .finished.catch(() => {});
}

// Kleine Belohnung beim Abschließen: bunte Schnipsel, nur transform und opacity
function Confetti() {
    const pieces = useMemo(
        () =>
            Array.from({ length: 18 }, (_, index) => {
                const angle = ((Math.PI * 2) / 18) * index + Math.random() * 0.4;
                const distance = 50 + Math.random() * 60;
                return {
                    dx: Math.cos(angle) * distance,
                    dy: Math.sin(angle) * distance - 24,
                    rotation: Math.random() * 360,
                    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                    delay: Math.random() * 70,
                };
            }),
        [],
    );

    return (
        <span className="shop-confetti" aria-hidden="true">
            {pieces.map((piece, index) => (
                <i
                    key={index}
                    style={{
                        "--dx": `${piece.dx}px`,
                        "--dy": `${piece.dy}px`,
                        "--rot": `${piece.rotation}deg`,
                        "--c": piece.color,
                        "--delay": `${piece.delay}ms`,
                    }}
                />
            ))}
        </span>
    );
}

function EmptyState({ Art, title, text, actionLabel, onAction }) {
    return (
        <div className="shop-empty">
            <Art className="shop-empty__art" />
            <h2>{title}</h2>
            <p>{text}</p>
            {onAction && (
                <button type="button" className="shop-btn shop-btn--ghost" onClick={onAction}>
                    <Plus weight="bold" aria-hidden="true" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

function ItemFields({ draft, onChange, idPrefix, autoFocus = false, nameRef = null }) {
    return (
        <>
            <label className="shop-field shop-field--name" htmlFor={`${idPrefix}-name`}>
                <span>Artikel</span>
                <input
                    ref={nameRef}
                    id={`${idPrefix}-name`}
                    className="shop-input"
                    type="text"
                    value={draft.name}
                    maxLength={120}
                    placeholder="z. B. Milch"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                />
            </label>
            <label className="shop-field" htmlFor={`${idPrefix}-quantity`}>
                <span>Menge</span>
                <input
                    id={`${idPrefix}-quantity`}
                    className="shop-input shop-input--number"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max={MAX_QUANTITY}
                    step="any"
                    value={draft.quantity}
                    onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
                />
            </label>
            <label className="shop-field" htmlFor={`${idPrefix}-unit`}>
                <span>Einheit</span>
                <input
                    id={`${idPrefix}-unit`}
                    className="shop-input"
                    type="text"
                    list="shop-units"
                    value={draft.unit}
                    maxLength={20}
                    autoComplete="off"
                    onChange={(event) => onChange({ ...draft, unit: event.target.value })}
                />
            </label>
        </>
    );
}

function ItemRow({
    item,
    index,
    enter,
    isEditing,
    editDraft,
    isConfirmingDelete,
    onToggle,
    onStatusChange,
    onStartEdit,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    onAskDelete,
    onConfirmDelete,
    onCancelDelete,
}) {
    const isCheckable = item.status === "planned" || item.status === "bought";
    const isBought = item.status === "bought";
    const quantity = quantityLabel(item);
    const hint = itemHint(item);
    const statusActions = STATUS_ACTIONS[item.status] ?? [];

    if (isEditing) {
        return (
            <li className="shop-row shop-row--editing" data-flip-id={item.id}>
                <form
                    className="shop-edit"
                    onSubmit={onSaveEdit}
                    onKeyDown={(event) => event.key === "Escape" && onCancelEdit()}
                >
                    <ItemFields
                        draft={editDraft}
                        onChange={onEditChange}
                        idPrefix={`edit-${item.id}`}
                        autoFocus
                    />
                    <div className="shop-edit__actions">
                        <button className="shop-btn shop-btn--primary" type="submit">
                            <Check weight="bold" aria-hidden="true" />
                            Speichern
                        </button>
                        <button className="shop-btn shop-btn--ghost" type="button" onClick={onCancelEdit}>
                            Abbrechen
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    const text = (
        <span className="shop-row__text">
            <span className="shop-row__name">{item.name}</span>
            {hint && <span className="shop-row__hint">{hint}</span>}
        </span>
    );

    const rowClass = [
        "shop-row",
        enter && `shop-row--${enter}`,
        isBought && "shop-row--done",
        item.status === "used_up" && "shop-row--muted",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <li className={rowClass} data-flip-id={item.id} style={{ "--i": index }}>
            {isCheckable ? (
                <label className="shop-row__main">
                    <input
                        className="shop-check__input"
                        type="checkbox"
                        checked={isBought}
                        onChange={() => onToggle(item)}
                    />
                    <span className="shop-check" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M5.5 12.5l4.2 4.2L18.5 8" />
                        </svg>
                    </span>
                    {text}
                    {quantity && (
                        <span className="shop-row__qty" title={quantity}>
                            {quantity}
                        </span>
                    )}
                </label>
            ) : (
                <div className="shop-row__main shop-row__main--static">
                    <span className="shop-avatar" aria-hidden="true">
                        {Array.from(item.name)[0]?.toUpperCase()}
                    </span>
                    {text}
                    {quantity && (
                        <span className="shop-row__qty" title={quantity}>
                            {quantity}
                        </span>
                    )}
                </div>
            )}

            <div className={`shop-row__actions${isConfirmingDelete ? " is-open" : ""}`}>
                {isConfirmingDelete ? (
                    <>
                        <button
                            type="button"
                            className="shop-pill shop-pill--danger"
                            onClick={() => onConfirmDelete(item)}
                        >
                            <Trash weight="bold" aria-hidden="true" />
                            Wirklich löschen
                        </button>
                        <button type="button" className="shop-pill" onClick={onCancelDelete}>
                            Abbrechen
                        </button>
                    </>
                ) : (
                    <>
                        {statusActions.map(({ label, next, Icon }, position) => (
                            <button
                                key={next}
                                type="button"
                                className={`shop-pill${position === 0 ? " shop-pill--accent" : ""}`}
                                aria-label={`${item.name}: ${label}`}
                                onClick={() => onStatusChange(item, next)}
                            >
                                <Icon weight="bold" aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="shop-icon-btn"
                            aria-label={`${item.name} bearbeiten`}
                            title="Bearbeiten"
                            onClick={() => onStartEdit(item)}
                        >
                            <PencilSimple weight="bold" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="shop-icon-btn shop-icon-btn--danger"
                            aria-label={`${item.name} löschen`}
                            title="Löschen"
                            onClick={() => onAskDelete(item)}
                        >
                            <Trash weight="bold" aria-hidden="true" />
                        </button>
                    </>
                )}
            </div>
        </li>
    );
}

export default function ShoppingBoard({ userId, activeHousehold, token }) {
    const householdId = activeHousehold?.id;

    const [items, setItems] = useState([]);
    const [loadState, setLoadState] = useState("loading"); // loading | ready | error
    const [view, setView] = useState("list"); // list = Einkaufsliste, stock = Vorrat
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [confetti, setConfetti] = useState(0);

    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [isAdding, setIsAdding] = useState(false);
    const nameInputRef = useRef(null);
    const addedViaKeyboard = useRef(false);

    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState(EMPTY_DRAFT);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Auftritt der Zeilen: kurzer Stagger nach dem Laden und beim Tab-Wechsel,
    // dazu ein Einblenden für gerade hinzugefügte Artikel (nicht bei Tastatureingabe)
    const [staggerOn, setStaggerOn] = useState(false);
    const [justAddedId, setJustAddedId] = useState(null);
    const staggerTimer = useRef(0);
    const listRef = useRef(null);

    const playStagger = useCallback(() => {
        if (prefersReducedMotion()) {
            return;
        }
        setStaggerOn(true);
        clearTimeout(staggerTimer.current);
        staggerTimer.current = setTimeout(() => setStaggerOn(false), 900);
    }, []);

    useEffect(() => () => clearTimeout(staggerTimer.current), []);

    // Nur die jüngste Anfrage darf die Liste setzen (z. B. beim Haushaltswechsel)
    const latestLoad = useRef(0);

    const loadItems = useCallback(async () => {
        const loadId = ++latestLoad.current;
        setLoadState("loading");
        setError("");

        try {
            const data = await request(token, `/${householdId}/items`);
            if (loadId === latestLoad.current) {
                setItems(data);
                setLoadState("ready");
                playStagger();
            }
        } catch (loadError) {
            if (loadId === latestLoad.current) {
                setError(loadError.message);
                setLoadState("error");
            }
        }
    }, [token, householdId, playStagger]);

    // Lädt die Liste neu, ohne die Anzeige auf "laden" zu setzen (z. B. nach einem Konflikt)
    const refreshItems = useCallback(async () => {
        try {
            setItems(await request(token, `/${householdId}/items`));
        } catch (refreshError) {
            setError(refreshError.message);
        }
    }, [token, householdId]);

    useEffect(() => {
        setItems([]);
        setEditingId(null);
        setConfirmDeleteId(null);
        setNotice("");

        if (token && householdId) {
            loadItems();
        }
    }, [token, householdId, loadItems]);

    // Gleitende Bewegung, wenn Artikel die Gruppe wechseln oder die Reihenfolge sich ändert
    useFlip(listRef, `${view}|${items.map((item) => `${item.id}:${item.status}`).join(",")}`);

    const replaceItem = (next) =>
        setItems((current) => current.map((entry) => (entry.id === next.id ? next : entry)));

    const switchView = (next) => {
        setView(next);
        setEditingId(null);
        setConfirmDeleteId(null);
        setNotice("");
        setError("");
        playStagger();
    };

    const addItem = async (event) => {
        event.preventDefault();

        // Tastatur-Aktionen werden nie animiert (Frequenz: sie passieren hundertfach)
        const viaKeyboard = addedViaKeyboard.current;
        addedViaKeyboard.current = false;

        const name = draft.name.trim();
        if (!name || isAdding) {
            return;
        }

        const quantity = parseQuantity(draft.quantity);
        if (quantity === null) {
            setError("Die Menge muss zwischen 0,01 und 9999,99 liegen.");
            return;
        }

        setIsAdding(true);
        setError("");
        setNotice("");

        try {
            const created = await request(token, `/${householdId}/items`, {
                method: "POST",
                body: JSON.stringify({
                    name,
                    quantity,
                    unit: draft.unit.trim() || null,
                    status: view === "stock" ? "in_stock" : "planned",
                }),
            });
            setItems((current) => [...current, created]);
            setDraft(EMPTY_DRAFT);
            nameInputRef.current?.focus();

            if (!viaKeyboard) {
                setJustAddedId(created.id);
                setTimeout(() => setJustAddedId(null), 700);
            }
        } catch (addError) {
            setError(addError.message);
        } finally {
            setIsAdding(false);
        }
    };

    // Statuswechsel: sofort sichtbar, bei Fehler wird der Artikel zurückgesetzt
    const changeStatus = async (item, nextStatus) => {
        setError("");
        setNotice("");
        replaceItem({ ...item, status: nextStatus });
        if (nextStatus === "bought") {
            vibrate(8);
        }

        try {
            replaceItem(
                await request(token, `/items/${item.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: nextStatus }),
                }),
            );
        } catch (statusError) {
            replaceItem(item);
            setError(statusError.message);
            if (statusError.status === 409) {
                refreshItems();
            }
        }
    };

    const toggleBought = (item) =>
        changeStatus(item, item.status === "bought" ? "planned" : "bought");

    // Alle abgehakten Artikel wandern in den Vorrat
    const checkout = async () => {
        setError("");
        setNotice("");

        try {
            const { moved } = await request(token, `/${householdId}/checkout`, { method: "POST" });
            await refreshItems();
            setNotice(
                moved === 1
                    ? "1 Artikel liegt jetzt im Vorrat."
                    : `${moved} Artikel liegen jetzt im Vorrat.`,
            );
            vibrate(14);
            if (!prefersReducedMotion()) {
                setConfetti(Date.now());
                setTimeout(() => setConfetti(0), 1100);
            }
        } catch (checkoutError) {
            setError(checkoutError.message);
        }
    };

    const startEdit = (item) => {
        setConfirmDeleteId(null);
        setEditingId(item.id);
        setEditDraft({
            name: item.name,
            quantity: String(item.quantity),
            unit: item.unit ?? "",
        });
    };

    const saveEdit = async (event) => {
        event.preventDefault();

        const name = editDraft.name.trim();
        const quantity = parseQuantity(editDraft.quantity);
        if (!name) {
            setError("Der Name darf nicht leer sein.");
            return;
        }
        if (quantity === null) {
            setError("Die Menge muss zwischen 0,01 und 9999,99 liegen.");
            return;
        }

        setError("");

        try {
            replaceItem(
                await request(token, `/items/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name, quantity, unit: editDraft.unit.trim() || null }),
                }),
            );
            setEditingId(null);
        } catch (saveError) {
            setError(saveError.message);
        }
    };

    const deleteItem = async (item) => {
        setError("");
        setNotice("");
        setConfirmDeleteId(null);

        try {
            await request(token, `/items/${item.id}`, { method: "DELETE" });
            await playExit(item.id);
            setItems((current) => current.filter((entry) => entry.id !== item.id));
        } catch (deleteError) {
            setError(deleteError.message);
        }
    };

    if (!userId || !token) {
        return (
            <div className="shop">
                <div className="shop-note">
                    <EmptyBasket className="shop-empty__art" />
                    <h1>Einkauf &amp; Vorrat</h1>
                    <p>Melde dich an, um die gemeinsame Einkaufsliste deines Haushalts zu nutzen.</p>
                    <Link className="shop-btn shop-btn--primary" to="/login">
                        Anmelden
                    </Link>
                </div>
            </div>
        );
    }

    if (!householdId) {
        return (
            <div className="shop">
                <div className="shop-note">
                    <EmptyShelf className="shop-empty__art" />
                    <h1>Einkauf &amp; Vorrat</h1>
                    <p>Wähle zuerst einen Haushalt aus oder lege einen an, dann geht es los.</p>
                    <Link className="shop-btn shop-btn--primary" to="/">
                        Zum Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const planned = items.filter((item) => item.status === "planned");
    const bought = items.filter((item) => item.status === "bought");
    const inStock = items.filter((item) => item.status === "in_stock");
    const usedUp = items.filter((item) => item.status === "used_up");
    const listCount = planned.length + bought.length;

    const renderRows = (list) =>
        list.map((item, index) => (
            <ItemRow
                key={item.id}
                item={item}
                index={index}
                enter={item.id === justAddedId ? "enter" : staggerOn ? "stagger" : ""}
                isEditing={editingId === item.id}
                editDraft={editDraft}
                isConfirmingDelete={confirmDeleteId === item.id}
                onToggle={toggleBought}
                onStatusChange={changeStatus}
                onStartEdit={startEdit}
                onEditChange={setEditDraft}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
                onAskDelete={(entry) => setConfirmDeleteId(entry.id)}
                onConfirmDelete={deleteItem}
                onCancelDelete={() => setConfirmDeleteId(null)}
            />
        ));

    return (
        <div className="shop">
            <header className="shop-hero">
                <div className="shop-hero__photos" aria-hidden="true">
                    <img
                        className={`shop-hero__photo${view === "list" ? " is-on" : ""}`}
                        src="/images/wire-basket-onions.webp"
                        alt=""
                        width="1024"
                        height="727"
                    />
                    <img
                        className={`shop-hero__photo${view === "stock" ? " is-on" : ""}`}
                        src="/images/market-greens.webp"
                        alt=""
                        width="1024"
                        height="681"
                    />
                </div>
                <div className="shop-hero__scrim" aria-hidden="true" />

                <div className="shop-hero__copy">
                    <p className="shop-hero__house">
                        <House weight="fill" aria-hidden="true" />
                        <span>{activeHousehold.name}</span>
                    </p>
                    <h1 id="shop-title" className="shop-hero__title">
                        Einkauf &amp; Vorrat
                    </h1>
                    <p className="shop-hero__stats">
                        <span>
                            <strong key={`p${planned.length}`} className="shop-bump">
                                {formatNumber(planned.length)}
                            </strong>{" "}
                            zu kaufen
                        </span>
                        <span>
                            <strong key={`s${inStock.length}`} className="shop-bump">
                                {formatNumber(inStock.length)}
                            </strong>{" "}
                            im Vorrat
                        </span>
                    </p>
                </div>
            </header>

            <div className="shop-tabs" role="group" aria-label="Ansicht" data-view={view}>
                <span className="shop-tabs__thumb" aria-hidden="true" />
                <button
                    type="button"
                    className="shop-tab"
                    aria-pressed={view === "list"}
                    onClick={() => switchView("list")}
                >
                    <ListChecks weight="bold" aria-hidden="true" />
                    Einkaufsliste
                    <span className="shop-tab__count">{listCount}</span>
                </button>
                <button
                    type="button"
                    className="shop-tab"
                    aria-pressed={view === "stock"}
                    onClick={() => switchView("stock")}
                >
                    <Package weight="bold" aria-hidden="true" />
                    Vorrat
                    <span className="shop-tab__count">{inStock.length}</span>
                </button>
            </div>

            {error && (
                <p className="shop-banner shop-banner--error" role="alert">
                    {error}
                </p>
            )}

            {notice && (
                <div className="shop-banner shop-banner--success" role="status">
                    <CheckCircle weight="fill" aria-hidden="true" />
                    <span>{notice}</span>
                    {confetti > 0 && <Confetti key={confetti} />}
                    {view === "list" && (
                        <button type="button" className="shop-pill" onClick={() => switchView("stock")}>
                            Zum Vorrat
                        </button>
                    )}
                </div>
            )}

            <form
                className="shop-composer"
                onSubmit={addItem}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        addedViaKeyboard.current = true;
                    }
                }}
            >
                <ItemFields draft={draft} onChange={setDraft} idPrefix="add" nameRef={nameInputRef} />
                <button
                    className="shop-btn shop-btn--primary shop-composer__submit"
                    type="submit"
                    disabled={isAdding || !draft.name.trim()}
                >
                    <Plus weight="bold" aria-hidden="true" />
                    {view === "stock" ? "In den Vorrat" : "Hinzufügen"}
                </button>
            </form>

            <datalist id="shop-units">
                {UNIT_SUGGESTIONS.map((unit) => (
                    <option key={unit} value={unit} />
                ))}
            </datalist>

            <div className="shop-panel" ref={listRef}>
                {loadState === "loading" && items.length === 0 && (
                    <div className="shop-skeleton" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                )}

                {loadState === "loading" && items.length === 0 && (
                    <p className="hh-sr-only" role="status">
                        Artikel werden geladen
                    </p>
                )}

                {loadState === "error" && (
                    <div className="shop-empty">
                        <p>Die Liste konnte nicht geladen werden.</p>
                        <button type="button" className="shop-btn shop-btn--ghost" onClick={loadItems}>
                            <ArrowCounterClockwise weight="bold" aria-hidden="true" />
                            Erneut laden
                        </button>
                    </div>
                )}

                {view === "list" && (
                    <>
                        {loadState === "ready" && listCount === 0 && (
                            <EmptyState
                                Art={EmptyBasket}
                                title="Die Einkaufsliste ist leer"
                                text="Trage ein, was ihr braucht. Alle im Haushalt sehen dieselbe Liste."
                                actionLabel="Ersten Artikel eintragen"
                                onAction={() => nameInputRef.current?.focus()}
                            />
                        )}

                        {planned.length > 0 && (
                            <section className="shop-group" aria-labelledby="shop-planned">
                                <h2 id="shop-planned" className="shop-group__title">
                                    Zu kaufen <span>{planned.length}</span>
                                </h2>
                                <ul className="shop-list">{renderRows(planned)}</ul>
                            </section>
                        )}

                        {bought.length > 0 && (
                            <section className="shop-group" aria-labelledby="shop-bought">
                                <h2 id="shop-bought" className="shop-group__title">
                                    Gekauft <span>{bought.length}</span>
                                </h2>
                                <ul className="shop-list">{renderRows(bought)}</ul>
                            </section>
                        )}
                    </>
                )}

                {view === "stock" && (
                    <>
                        {loadState === "ready" && inStock.length === 0 && usedUp.length === 0 && (
                            <EmptyState
                                Art={EmptyShelf}
                                title="Im Vorrat ist noch nichts"
                                text="Gekaufte Artikel landen nach „Einkauf abschließen“ hier. Du kannst Vorräte auch direkt eintragen."
                                actionLabel="Vorrat eintragen"
                                onAction={() => nameInputRef.current?.focus()}
                            />
                        )}

                        {inStock.length > 0 && (
                            <section className="shop-group" aria-labelledby="shop-stock">
                                <h2 id="shop-stock" className="shop-group__title">
                                    Im Vorrat <span>{inStock.length}</span>
                                </h2>
                                <ul className="shop-list">{renderRows(inStock)}</ul>
                            </section>
                        )}

                        {usedUp.length > 0 && (
                            <section className="shop-group" aria-labelledby="shop-used-up">
                                <h2 id="shop-used-up" className="shop-group__title">
                                    Aufgebraucht <span>{usedUp.length}</span>
                                </h2>
                                <ul className="shop-list">{renderRows(usedUp)}</ul>
                            </section>
                        )}
                    </>
                )}
            </div>

            {view === "list" && bought.length > 0 && (
                <div className="shop-checkout">
                    <span className="shop-checkout__icon" aria-hidden="true">
                        <ShoppingCartSimple weight="fill" />
                    </span>
                    <p className="shop-checkout__text">
                        {bought.length} Artikel gekauft
                        <span>Beim Abschließen wandern sie in den Vorrat.</span>
                    </p>
                    <button type="button" className="shop-btn shop-btn--light" onClick={checkout}>
                        <Check weight="bold" aria-hidden="true" />
                        Einkauf abschließen
                    </button>
                </div>
            )}
        </div>
    );
}
