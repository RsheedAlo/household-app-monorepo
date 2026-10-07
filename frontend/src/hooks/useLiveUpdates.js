import { useEffect, useRef, useState } from "react";

import { API_URL } from "../config";

const FIRST_DELAY_MS = 1000;
const MAX_DELAY_MS = 15000;
const PING_EVERY_MS = 25000;
const COALESCE_MS = 120;

// Schließcodes des Servers: Token ungültig oder kein Mitglied. Ein erneuter Versuch bringt nichts.
const GIVE_UP_CODES = [4401, 4403];

function socketUrl(householdId) {
    const base = API_URL.replace(/^http/, "ws").replace(/\/$/, "");
    return `${base}/api/shopping/${householdId}/ws`;
}

// Hält eine WebSocket-Verbindung zum Haushalt und ruft onChange, wenn jemand etwas geändert hat.
// Status: "connecting" | "live" | "offline" ("off" ohne Anmeldung oder Haushalt).
// Bei jedem (Wieder-)Verbinden wird einmal neu geladen, damit nach einem Abbruch nichts fehlt.
// Fällt die Verbindung aus, bleibt die Seite benutzbar und versucht es mit wachsendem Abstand erneut.
export default function useLiveUpdates(token, householdId, onChange) {
    const [status, setStatus] = useState("off");
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    });

    useEffect(() => {
        if (!token || !householdId || typeof WebSocket === "undefined") {
            setStatus("off");
            return undefined;
        }

        let stopped = false;
        let socket = null;
        let retryTimer = 0;
        let pingTimer = 0;
        let coalesceTimer = 0;
        let delay = FIRST_DELAY_MS;

        const trigger = () => {
            // Mehrere Meldungen kurz hintereinander führen nur zu einem Neuladen
            clearTimeout(coalesceTimer);
            coalesceTimer = setTimeout(() => onChangeRef.current?.(), COALESCE_MS);
        };

        const connect = () => {
            if (stopped) {
                return;
            }
            setStatus("connecting");
            socket = new WebSocket(socketUrl(householdId));

            socket.onopen = () => socket.send(JSON.stringify({ token }));

            socket.onmessage = (event) => {
                let message;
                try {
                    message = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (message.type === "ready") {
                    delay = FIRST_DELAY_MS;
                    setStatus("live");
                    trigger();
                    clearInterval(pingTimer);
                    pingTimer = setInterval(() => {
                        if (socket?.readyState === WebSocket.OPEN) {
                            socket.send("ping");
                        }
                    }, PING_EVERY_MS);
                } else if (message.type === "changed") {
                    trigger();
                }
            };

            socket.onclose = (event) => {
                clearInterval(pingTimer);
                if (stopped) {
                    return;
                }
                setStatus("offline");
                if (GIVE_UP_CODES.includes(event.code)) {
                    return;
                }
                retryTimer = setTimeout(connect, delay);
                delay = Math.min(delay * 2, MAX_DELAY_MS);
            };

            // Fehler führen immer auch zu onclose, dort wird neu verbunden
            socket.onerror = () => {};
        };

        // Wieder sichtbar oder online: sofort neu laden und, falls getrennt, gleich neu verbinden
        const onWake = () => {
            if (document.visibilityState === "hidden") {
                return;
            }
            trigger();
            if (socket && socket.readyState === WebSocket.CLOSED) {
                clearTimeout(retryTimer);
                delay = FIRST_DELAY_MS;
                connect();
            }
        };

        connect();
        document.addEventListener("visibilitychange", onWake);
        window.addEventListener("online", onWake);

        return () => {
            stopped = true;
            clearTimeout(retryTimer);
            clearTimeout(coalesceTimer);
            clearInterval(pingTimer);
            document.removeEventListener("visibilitychange", onWake);
            window.removeEventListener("online", onWake);
            if (socket) {
                socket.onclose = null;
                socket.close();
            }
        };
    }, [token, householdId]);

    return status;
}
