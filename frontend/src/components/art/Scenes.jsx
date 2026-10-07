// Selbst gezeichnete Szenen für Dashboard und Einkauf/Vorrat (ersetzen die früheren Fotos).
// Flat-Stil wie die Sticker, rein dekorativ (aria-hidden).

const WICKER = "#d99a52";
const WICKER_DARK = "#b97a32";

// Hero: Einkaufskorb mit Brot, Möhren, Salat, Tomate und Zitrone
export function BasketScene(props) {
    return (
        <svg viewBox="0 0 480 380" aria-hidden="true" focusable="false" {...props}>
            <defs>
                <clipPath id="scene-basket-clip">
                    <path d="M104 214 H376 L346 336 Q343 350 329 350 H151 Q137 350 134 336 Z" />
                </clipPath>
            </defs>

            <circle cx="240" cy="190" r="168" fill="#e6edff" />
            <circle cx="240" cy="190" r="168" fill="none" stroke="#fff" strokeWidth="6" opacity="0.7" />
            <path d="M92 74 l7 -14 l7 14 l14 7 l-14 7 l-7 14 l-7 -14 l-14 -7z" fill="#ffc83d" />
            <circle cx="398" cy="96" r="9" fill="#f26b4b" />
            <circle cx="64" cy="224" r="6" fill="#4376f2" />

            {/* Henkel */}
            <path
                d="M132 206 C128 76 352 76 348 206"
                fill="none"
                stroke={WICKER_DARK}
                strokeWidth="16"
                strokeLinecap="round"
            />

            {/* Inhalt */}
            <g transform="rotate(16 316 170)">
                <rect x="296" y="76" width="42" height="150" rx="21" fill="#f0b866" />
                <path
                    d="M303 106 l14 -9 M303 136 l22 -14 M303 166 l24 -15"
                    stroke="#d6923a"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
            </g>
            <g transform="rotate(-14 170 190)">
                <path d="M146 214 L162 108 Q165 98 174 108 L190 214 Z" fill="#f4893a" />
                <path d="M157 160 h14 M153 186 h22" stroke="#d96d1c" strokeWidth="4" strokeLinecap="round" />
                <path d="M168 108 C150 80 154 66 164 54 C168 70 178 72 168 108Z" fill="#2fb872" />
                <path d="M168 108 C176 80 192 74 202 70 C196 88 182 96 168 108Z" fill="#1e9d5c" />
            </g>
            <g>
                <circle cx="236" cy="168" r="48" fill="#2fb872" />
                <path d="M236 122 C214 150 214 186 236 214 M236 122 C258 150 258 186 236 214" stroke="#1e9d5c" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M196 168 C214 160 226 160 236 170 C246 160 260 160 276 168" stroke="#1e9d5c" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
            <circle cx="290" cy="196" r="34" fill="#f26b4b" />
            <ellipse cx="278" cy="184" rx="9" ry="5" transform="rotate(-35 278 184)" fill="#fff" opacity="0.45" />
            <path d="M290 164 l-8 -10 l8 4 l8 -4 l-8 10z" fill="#2fa866" />

            {/* Korb */}
            <path d="M104 214 H376 L346 336 Q343 350 329 350 H151 Q137 350 134 336 Z" fill={WICKER} />
            <g clipPath="url(#scene-basket-clip)" stroke={WICKER_DARK} strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M100 244 H380 M100 274 H380 M100 304 H380 M100 334 H380" />
                <path d="M150 214 v30 M210 214 v30 M270 214 v30 M330 214 v30 M120 244 v30 M180 244 v30 M240 244 v30 M300 244 v30 M360 244 v30 M150 274 v30 M210 274 v30 M270 274 v30 M330 274 v30 M120 304 v36 M180 304 v36 M240 304 v36 M300 304 v36 M360 304 v36" />
            </g>
            <rect x="94" y="200" width="292" height="30" rx="15" fill="#c4863f" />
            <rect x="94" y="200" width="292" height="11" rx="5.5" fill="#d99a52" opacity="0.7" />
        </svg>
    );
}

// Kachel Einkauf: drei Zutaten, die locker verteilt sind
export function ShopTileArt(props) {
    return (
        <svg viewBox="0 0 320 240" aria-hidden="true" focusable="false" {...props}>
            <circle cx="160" cy="120" r="108" fill="#10805f" opacity="0.55" />
            <circle cx="160" cy="120" r="72" fill="#10805f" opacity="0.6" />
            <g transform="translate(40 40) rotate(-12 60 60) scale(1.1)">
                <circle cx="60" cy="70" r="44" fill="#f26b4b" />
                <ellipse cx="46" cy="58" rx="10" ry="6" transform="rotate(-35 46 58)" fill="#fff" opacity="0.4" />
                <path d="M60 30 l-10 -14 l10 6 l10 -6 l-10 14z" fill="#34c27d" />
            </g>
            <g transform="translate(168 78) rotate(14 50 50)">
                <path d="M10 76 C6 34 40 8 92 8 C96 54 70 88 10 76Z" fill="#34c27d" />
                <path d="M16 70 C38 50 62 30 86 14" stroke="#157a47" strokeWidth="4" strokeLinecap="round" fill="none" />
            </g>
            <g transform="translate(190 8) rotate(-8 40 40) scale(0.9)">
                <path d="M6 54 C6 30 34 14 60 18 C84 24 92 52 78 68 C62 86 28 86 12 72Z" fill="#ffc83d" />
                <path d="M24 46 C28 38 38 32 50 32" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.65" fill="none" />
            </g>
            <path d="M34 196 l5 -10 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5z" fill="#fff" opacity="0.55" />
            <circle cx="280" cy="206" r="7" fill="#ffc83d" />
        </svg>
    );
}

// Kachel Aufgaben: Karten mit Haken, wie ein Board
export function TasksTileArt(props) {
    return (
        <svg viewBox="0 0 280 200" aria-hidden="true" focusable="false" {...props}>
            <rect x="14" y="20" width="118" height="150" rx="18" fill="#fff" opacity="0.14" />
            <rect x="148" y="20" width="118" height="150" rx="18" fill="#fff" opacity="0.14" />
            <g>
                <rect x="26" y="36" width="94" height="40" rx="12" fill="#fff" />
                <circle cx="46" cy="56" r="9" fill="none" stroke="#d97706" strokeWidth="4" />
                <rect x="64" y="50" width="42" height="7" rx="3.5" fill="#d9c3a6" />
                <rect x="64" y="62" width="26" height="6" rx="3" fill="#ecdcc6" />
                <rect x="26" y="86" width="94" height="40" rx="12" fill="#fff" />
                <circle cx="46" cy="106" r="9" fill="none" stroke="#d97706" strokeWidth="4" />
                <rect x="64" y="100" width="36" height="7" rx="3.5" fill="#d9c3a6" />
                <rect x="64" y="112" width="30" height="6" rx="3" fill="#ecdcc6" />
            </g>
            <g transform="rotate(4 207 100)">
                <rect x="160" y="36" width="94" height="40" rx="12" fill="#ffc83d" />
                <circle cx="180" cy="56" r="9" fill="#78350f" />
                <path d="M175.5 56 l3.5 3.5 l6.5 -7" stroke="#ffc83d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <rect x="198" y="50" width="40" height="7" rx="3.5" fill="#78350f" opacity="0.5" />
                <rect x="198" y="62" width="24" height="6" rx="3" fill="#78350f" opacity="0.3" />
            </g>
            <path d="M232 150 l5 -10 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5z" fill="#fff" opacity="0.5" />
        </svg>
    );
}

// Kachel Kalender: Monatsblatt mit markiertem Tag
export function CalendarTileArt(props) {
    const days = [];
    for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 5; col += 1) {
            days.push(
                <circle key={`${row}-${col}`} cx={52 + col * 38} cy={92 + row * 34} r="7" fill="#c9d6fb" />,
            );
        }
    }

    return (
        <svg viewBox="0 0 280 200" aria-hidden="true" focusable="false" {...props}>
            <g transform="rotate(-5 140 100)">
                <rect x="24" y="22" width="232" height="156" rx="22" fill="#fff" />
                <path d="M24 44 a22 22 0 0 1 22 -22 h188 a22 22 0 0 1 22 22 v22 H24z" fill="#f26b4b" />
                <rect x="70" y="10" width="10" height="26" rx="5" fill="#14349a" />
                <rect x="200" y="10" width="10" height="26" rx="5" fill="#14349a" />
                <rect x="44" y="40" width="70" height="8" rx="4" fill="#fff" opacity="0.85" />
                {days}
                <circle cx="166" cy="126" r="16" fill="#1d4ed8" />
                <circle cx="166" cy="126" r="7" fill="#ffc83d" />
            </g>
            <circle cx="262" cy="30" r="8" fill="#ffc83d" />
            <path d="M18 168 l5 -10 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5z" fill="#fff" opacity="0.5" />
        </svg>
    );
}

// Einkauf/Vorrat-Banner: zwei Szenen, die beim Tab-Wechsel überblenden (Korb mit Einkauf, Regal mit Gläsern)
export function ShopHeroArt({ view }) {
    return (
        <div className="shop-hero__art" aria-hidden="true">
            <svg
                className={`shop-hero__scene${view === "list" ? " is-on" : ""}`}
                viewBox="0 0 360 220"
                focusable="false"
            >
                <circle cx="250" cy="120" r="132" fill="#0b6a50" />
                <circle cx="250" cy="120" r="88" fill="#10805f" />
                <g transform="translate(150 20)">
                    <path d="M26 80 C22 -4 160 -4 156 80" fill="none" stroke={WICKER_DARK} strokeWidth="11" strokeLinecap="round" />
                    <circle cx="70" cy="76" r="26" fill="#f26b4b" />
                    <path d="M70 52 l-7 -9 l7 4 l7 -4 l-7 9z" fill="#34c27d" />
                    <circle cx="116" cy="70" r="30" fill="#34c27d" />
                    <path d="M116 40 C102 60 102 82 116 100 M116 40 C130 60 130 82 116 100" stroke="#1e9d5c" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M20 96 H162 L148 168 Q146 178 136 178 H46 Q36 178 34 168 Z" fill={WICKER} />
                    <path d="M26 122 H156 M30 146 H152" stroke={WICKER_DARK} strokeWidth="4" strokeLinecap="round" />
                    <rect x="14" y="86" width="154" height="20" rx="10" fill="#c4863f" />
                </g>
                <circle cx="326" cy="40" r="8" fill="#ffc83d" />
                <path d="M120 40 l5 -10 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5z" fill="#fff" opacity="0.5" />
            </svg>

            <svg
                className={`shop-hero__scene${view === "stock" ? " is-on" : ""}`}
                viewBox="0 0 360 220"
                focusable="false"
            >
                <circle cx="250" cy="120" r="132" fill="#0b6a50" />
                <circle cx="250" cy="120" r="88" fill="#10805f" />
                <rect x="132" y="168" width="200" height="12" rx="6" fill="#c4863f" />
                <rect x="132" y="92" width="200" height="10" rx="5" fill="#c4863f" />
                <g>
                    <rect x="146" y="102" width="44" height="66" rx="12" fill="#fff" opacity="0.9" />
                    <rect x="146" y="102" width="44" height="14" rx="6" fill="#ffc83d" />
                    <rect x="154" y="128" width="28" height="22" rx="6" fill="#f26b4b" />
                    <rect x="204" y="112" width="40" height="56" rx="12" fill="#fff" opacity="0.9" />
                    <rect x="204" y="112" width="40" height="12" rx="6" fill="#34c27d" />
                    <rect x="212" y="134" width="24" height="18" rx="6" fill="#ffc83d" />
                    <rect x="258" y="108" width="52" height="60" rx="14" fill="#fff" opacity="0.9" />
                    <rect x="258" y="108" width="52" height="14" rx="7" fill="#f26b4b" />
                    <rect x="268" y="132" width="32" height="22" rx="7" fill="#34c27d" />
                </g>
                <g>
                    <rect x="150" y="30" width="36" height="62" rx="10" fill="#fff" opacity="0.9" />
                    <rect x="150" y="30" width="36" height="12" rx="5" fill="#f26b4b" />
                    <rect x="212" y="42" width="52" height="50" rx="12" fill="#fff" opacity="0.9" />
                    <rect x="212" y="42" width="52" height="12" rx="6" fill="#ffc83d" />
                    <rect x="220" y="62" width="36" height="18" rx="6" fill="#34c27d" />
                    <rect x="280" y="36" width="34" height="56" rx="10" fill="#fff" opacity="0.9" />
                    <rect x="280" y="36" width="34" height="12" rx="5" fill="#34c27d" />
                </g>
                <circle cx="326" cy="40" r="8" fill="#ffc83d" />
            </svg>
        </div>
    );
}
