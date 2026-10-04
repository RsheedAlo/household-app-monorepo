import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "../config";
import "./ShoppingBoard.css";

const EMPTY_DRAFT = { name: "", quantity: "1", unit: "" };
const UNIT_SUGGESTIONS = ["Stk", "Pkg", "kg", "g", "l", "ml"];
const MAX_QUANTITY = 9999.99;

// Zahlen im deutschen Format ohne unnötige Nachkommastellen (2,5 statt 2.50)
const numberFormat = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 });

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

function describeError(status, data) {
    if (status === 401) {
        return "Deine Sitzung ist abgelaufen. Bitte melde dich neu an.";
    }
    if (status === 403 || status === 404) {
        return "Dieser Artikel oder Haushalt ist nicht mehr verfügbar. Lade die Seite neu.";
    }
    if (status === 422) {
        return "Bitte prüfe deine Eingabe: Der Name braucht 1 bis 120 Zeichen, die Menge muss größer als 0 sein.";
    }
    if (typeof data?.detail === "string") {
        return data.detail;
    }
    return "Das hat nicht geklappt. Versuche es gleich noch einmal.";
}

// Einheitlicher Aufruf der Einkauf/Vorrat-API mit Bearer-Token
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
        throw new Error(describeError(response.status, data));
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
    onStartEdit,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    onAskDelete,
    onConfirmDelete,
    onCancelDelete,
}) {
    const isBought = item.status === "bought";
    const quantity = quantityLabel(item);

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

    return (
        <li className={`shop-row${isBought ? " shop-row--done" : ""}`}>
            <label className="shop-row__check">
                <input type="checkbox" checked={isBought} onChange={() => onToggle(item)} />
                <span className="shop-row__label">
                    <span className="shop-row__name">{item.name}</span>
                    {quantity && <span className="shop-row__qty">{quantity}</span>}
                </span>
            </label>

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
    const [error, setError] = useState("");

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

    useEffect(() => {
        setItems([]);
        setEditingId(null);
        setConfirmDeleteId(null);

        if (token && householdId) {
            loadItems();
        }
    }, [token, householdId, loadItems]);

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

        try {
            const created = await request(token, `/${householdId}/items`, {
                method: "POST",
                body: JSON.stringify({ name, quantity, unit: draft.unit.trim() || null }),
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

    // Abhaken und wieder zurücknehmen: sofort sichtbar, bei Fehler wird zurückgesetzt
    const toggleBought = async (item) => {
        const nextStatus = item.status === "bought" ? "planned" : "bought";
        const replaceItem = (next) =>
            setItems((current) => current.map((entry) => (entry.id === next.id ? next : entry)));

        setError("");
        replaceItem({ ...item, status: nextStatus });

        try {
            replaceItem(
                await request(token, `/items/${item.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: nextStatus }),
                }),
            );
        } catch (toggleError) {
            replaceItem(item);
            setError(toggleError.message);
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
            const updated = await request(token, `/items/${editingId}`, {
                method: "PATCH",
                body: JSON.stringify({ name, quantity, unit: editDraft.unit.trim() || null }),
            });
            setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
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

    const renderRows = (list) =>
        list.map((item) => (
            <ItemRow
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                editDraft={editDraft}
                isConfirmingDelete={confirmDeleteId === item.id}
                onToggle={toggleBought}
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

            {error && (
                <p className="message-banner message-banner--error" role="alert">
                    {error}
                </p>
            )}

            <form className="shop-add" onSubmit={addItem}>
                <ItemFields draft={draft} onChange={setDraft} idPrefix="add" nameRef={nameInputRef} />
                <button
                    className="button-primary shop-add__submit"
                    type="submit"
                    disabled={isAdding || !draft.name.trim()}
                >
                    Hinzufügen
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

            {loadState === "ready" && items.length === 0 && (
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
        </section>
    );
}
