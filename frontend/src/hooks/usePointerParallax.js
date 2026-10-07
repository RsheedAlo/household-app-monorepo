import { useEffect } from "react";

// Setzt --px und --py (-1 bis 1) auf dem Element, solange der Mauszeiger darüber ist.
// Ebenen verschieben sich damit leicht gegeneinander. Nur auf Zeigergeräten und
// nicht bei prefers-reduced-motion, denn auf Touch gibt es keinen Zeiger.
export default function usePointerParallax(ref) {
    useEffect(() => {
        const element = ref.current;
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!element || !canHover || reduce) {
            return undefined;
        }

        let frame = 0;

        const onMove = (event) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const box = element.getBoundingClientRect();
                const x = ((event.clientX - box.left) / box.width) * 2 - 1;
                const y = ((event.clientY - box.top) / box.height) * 2 - 1;
                element.style.setProperty("--px", x.toFixed(3));
                element.style.setProperty("--py", y.toFixed(3));
            });
        };

        const onLeave = () => {
            cancelAnimationFrame(frame);
            element.style.setProperty("--px", "0");
            element.style.setProperty("--py", "0");
        };

        element.addEventListener("pointermove", onMove);
        element.addEventListener("pointerleave", onLeave);

        return () => {
            cancelAnimationFrame(frame);
            element.removeEventListener("pointermove", onMove);
            element.removeEventListener("pointerleave", onLeave);
        };
    }, [ref]);
}
