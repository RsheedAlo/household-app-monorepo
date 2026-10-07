import { useLayoutEffect, useRef } from "react";

// FLIP-Animation (First, Last, Invert, Play) für Listen:
// Merkt sich nach jedem Rendern die Position aller Elemente mit data-flip-id. Ändert sich der
// Schlüssel (z. B. Reihenfolge oder Gruppe der Artikel), gleiten die Elemente von der alten zur
// neuen Position. Es wird nur transform animiert (Web Animations API), nichts Layout-Teures.
// Bei prefers-reduced-motion springen die Elemente wie bisher.
export default function useFlip(containerRef, changeKey) {
    const positions = useRef(new Map());
    const lastKey = useRef(changeKey);

    // Bewusst ohne Abhängigkeitsliste: Die Positionen müssen nach jedem Rendern aktuell sein,
    // auch wenn sich z. B. nur ein Hinweisbanner darüber eingeblendet hat.
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const shouldAnimate = lastKey.current !== changeKey && !reduce;
        lastKey.current = changeKey;

        const origin = container.getBoundingClientRect();
        const next = new Map();

        container.querySelectorAll("[data-flip-id]").forEach((element) => {
            const box = element.getBoundingClientRect();
            const position = { x: box.left - origin.left, y: box.top - origin.top };
            const id = element.dataset.flipId;
            next.set(id, position);

            const before = positions.current.get(id);
            if (
                shouldAnimate &&
                before &&
                (Math.abs(before.x - position.x) > 1 || Math.abs(before.y - position.y) > 1)
            ) {
                element.animate(
                    [
                        { transform: `translate(${before.x - position.x}px, ${before.y - position.y}px)` },
                        { transform: "none" },
                    ],
                    { duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
                );
            }
        });

        positions.current = next;
    });
}
