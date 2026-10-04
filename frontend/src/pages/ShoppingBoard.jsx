import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "../config";
import "./ShoppingBoard.css";

const EMPTY_DRAFT = { name: "", quantity: "1", unit: "" };
const UNIT_SUGGESTIONS = ["Stk", "Pkg", "kg", "g", "l", "ml"];
const MAX_QUANTITY = 9999.99;
const DAY_MS = 24 * 60 * 60 * 1000;

// Aktionen pro Status für Artikel im Vorrat und für aufgebrauchte Artikel.
// Die erste Aktion ist die übliche und wird hervorgehoben.
const STATUS_ACTIONS = {
    in_stock: [{ label: "Aufgebraucht", next: "used_up" }],
    used_up: [
        { label: "Nachkaufen", next: "planned" },
        { label: "Rückgängig", next: "in_stock" },
    ],
};

// Zahlen im deutschen Format ohne unnötige Nachkommastellen (2,5 statt 2.50)
const numberFormat = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 });
const relativeTime = new Intl.RelativeTimeFormat("de", { numeric: "auto" });

// "1" ohne Einheit ist der Normalfall und wird nicht extra angezeigt
function quantityLabel(item) {
    if (item.quantity === 1 && !item.unit) {
        return "";
    }
    return [numberFormat.format(item.quantity), item.unit].filter(Boolean).join(" ");
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

function ItemFields({ draft, onChange, idPrefix, autoFocus = false, nameRef = null }) {
    return (
        <>
            <label className="shop-field shop-field--name" htmlFor={`${idPrefix}-name`}>
                <span>Artikel</span>
                <input
                    ref={nameRef}
                    id={`${idPrefix}-name`}
                    className="text-input"
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
                    className="text-input shop-number"
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
                    className="text-input"
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
            <li className="shop-row shop-row--editing">
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
                        <button className="button-primary" type="submit">
                            Speichern
                        </button>
                        <button className="button-secondary" type="button" onClick={onCancelEdit}>
                            Abbrechen
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    const text = (
        <span className="shop-row__label">
            <span className="shop-row__name">{item.name}</span>
            {quantity && <span className="shop-row__qty">{quantity}</span>}
            {hint && <span className="shop-row__hint">{hint}</span>}
        </span>
    );

    const rowClass = [
        "shop-row",
        isBought && "shop-row--done",
        item.status === "used_up" && "shop-row--muted",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <li className={rowClass}>
            {isCheckable ? (
                <label className="shop-row__check">
                    <input type="checkbox" checked={isBought} onChange={() => onToggle(item)} />
                    {text}
                </label>
            ) : (
                <div className="shop-row__check shop-row__check--static">{text}</div>
            )}

            <div className="shop-row__actions">
                {isConfirmingDelete ? (
                    <>
                        <button
                            type="button"
                            className="shop-btn shop-btn--danger"
                            onClick={() => onConfirmDelete(item)}
                        >
                            Wirklich löschen
                        </button>
                        <button type="button" className="shop-btn" onClick={onCancelDelete}>
                            Abbrechen
                        </button>
                    </>
                ) : (
                    <>
                        {statusActions.map(({ label, next }, index) => (
                            <button
                                key={next}
                                type="button"
                                className={`shop-btn${index === 0 ? " shop-btn--accent" : ""}`}
                                aria-label={`${item.name}: ${label}`}
                                onClick={() => onStatusChange(item, next)}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="shop-btn"
                            aria-label={`${item.name} bearbeiten`}
                            onClick={() => onStartEdit(item)}
                        >
                            Bearbeiten
                        </button>
                        <button
                            type="button"
                            className="shop-btn shop-btn--danger"
                            aria-label={`${item.name} löschen`}
                            onClick={() => onAskDelete(item)}
                        >
                            Löschen
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

    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [isAdding, setIsAdding] = useState(false);
    const nameInputRef = useRef(null);

    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState(EMPTY_DRAFT);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
            }
        } catch (loadError) {
            if (loadId === latestLoad.current) {
                setError(loadError.message);
                setLoadState("error");
            }
        }
    }, [token, householdId]);

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

    const replaceItem = (next) =>
        setItems((current) => current.map((entry) => (entry.id === next.id ? next : entry)));

    const switchView = (next) => {
        setView(next);
        setEditingId(null);
        setConfirmDeleteId(null);
        setNotice("");
        setError("");
    };

    const addItem = async (event) => {
        event.preventDefault();

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
        setConfirmDeleteId(null);

        try {
            await request(token, `/items/${item.id}`, { method: "DELETE" });
            setItems((current) => current.filter((entry) => entry.id !== item.id));
        } catch (deleteError) {
            setError(deleteError.message);
        }
    };

    if (!userId || !token) {
        return (
            <section className="section-card">
                <p className="section-empty">Bitte zuerst anmelden, um die Einkaufsliste zu nutzen.</p>
            </section>
        );
    }

    if (!householdId) {
        return (
            <section className="section-card">
                <p className="section-empty">
                    Bitte zuerst einen aktiven Haushalt auswählen oder erstellen.
                </p>
            </section>
        );
    }

    const planned = items.filter((item) => item.status === "planned");
    const bought = items.filter((item) => item.status === "bought");
    const inStock = items.filter((item) => item.status === "in_stock");
    const usedUp = items.filter((item) => item.status === "used_up");
    const listCount = planned.length + bought.length;

    const renderRows = (list) =>
        list.map((item) => (
            <ItemRow
                key={item.id}
                item={item}
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
        <section className="section-card shop" aria-labelledby="shop-title">
            <header className="shop__header">
                <h2 id="shop-title" className="shop__title">
                    Einkauf &amp; Vorrat
                </h2>
                <p className="shop__household">
                    Haushalt: <strong>{activeHousehold.name}</strong>
                </p>
            </header>

            <div className="shop-tabs" role="group" aria-label="Ansicht">
                <button
                    type="button"
                    className="shop-tab"
                    aria-pressed={view === "list"}
                    onClick={() => switchView("list")}
                >
                    Einkaufsliste <span className="shop-tab__count">{listCount}</span>
                </button>
                <button
                    type="button"
                    className="shop-tab"
                    aria-pressed={view === "stock"}
                    onClick={() => switchView("stock")}
                >
                    Vorrat <span className="shop-tab__count">{inStock.length}</span>
                </button>
            </div>

            {error && (
                <p className="message-banner message-banner--error" role="alert">
                    {error}
                </p>
            )}

            {notice && (
                <div className="message-banner message-banner--success shop-notice" role="status">
                    <span>{notice}</span>
                    {view === "list" && (
                        <button type="button" className="shop-btn" onClick={() => switchView("stock")}>
                            Zum Vorrat
                        </button>
                    )}
                </div>
            )}

            <form className="shop-add" onSubmit={addItem}>
                <ItemFields draft={draft} onChange={setDraft} idPrefix="add" nameRef={nameInputRef} />
                <button
                    className="button-primary shop-add__submit"
                    type="submit"
                    disabled={isAdding || !draft.name.trim()}
                >
                    {view === "stock" ? "In den Vorrat" : "Hinzufügen"}
                </button>
            </form>

            <datalist id="shop-units">
                {UNIT_SUGGESTIONS.map((unit) => (
                    <option key={unit} value={unit} />
                ))}
            </datalist>

            {loadState === "loading" && <p className="shop-empty">Artikel werden geladen …</p>}

            {loadState === "error" && (
                <div className="shop-empty">
                    <button className="button-secondary" type="button" onClick={loadItems}>
                        Erneut laden
                    </button>
                </div>
            )}

            {view === "list" && (
                <>
                    {loadState === "ready" && listCount === 0 && (
                        <p className="shop-empty">
                            Die Einkaufsliste ist leer. Trage oben den ersten Artikel ein.
                        </p>
                    )}

                    {planned.length > 0 && (
                        <section className="shop-group" aria-labelledby="shop-planned">
                            <h3 id="shop-planned" className="shop-group__title">
                                Zu kaufen <span className="shop-group__count">{planned.length}</span>
                            </h3>
                            <ul className="shop-list">{renderRows(planned)}</ul>
                        </section>
                    )}

                    {bought.length > 0 && (
                        <section className="shop-group" aria-labelledby="shop-bought">
                            <h3 id="shop-bought" className="shop-group__title">
                                Gekauft <span className="shop-group__count">{bought.length}</span>
                            </h3>
                            <ul className="shop-list">{renderRows(bought)}</ul>
                        </section>
                    )}

                    {bought.length > 0 && (
                        <div className="shop-checkout">
                            <p className="shop-checkout__text">
                                {bought.length} Artikel gekauft
                                <span className="shop-checkout__hint">
                                    Beim Abschließen wandern sie in den Vorrat.
                                </span>
                            </p>
                            <button className="button-primary" type="button" onClick={checkout}>
                                Einkauf abschließen
                            </button>
                        </div>
                    )}
                </>
            )}

            {view === "stock" && (
                <>
                    {loadState === "ready" && inStock.length === 0 && usedUp.length === 0 && (
                        <p className="shop-empty">
                            Im Vorrat ist noch nichts. Gekaufte Artikel landen hier nach „Einkauf
                            abschließen“. Du kannst Vorräte oben auch direkt eintragen.
                        </p>
                    )}

                    {inStock.length > 0 && (
                        <section className="shop-group" aria-labelledby="shop-stock">
                            <h3 id="shop-stock" className="shop-group__title">
                                Im Vorrat <span className="shop-group__count">{inStock.length}</span>
                            </h3>
                            <ul className="shop-list">{renderRows(inStock)}</ul>
                        </section>
                    )}

                    {usedUp.length > 0 && (
                        <section className="shop-group" aria-labelledby="shop-used-up">
                            <h3 id="shop-used-up" className="shop-group__title">
                                Aufgebraucht <span className="shop-group__count">{usedUp.length}</span>
                            </h3>
                            <ul className="shop-list">{renderRows(usedUp)}</ul>
                        </section>
                    )}
                </>
            )}
        </section>
    );
}
