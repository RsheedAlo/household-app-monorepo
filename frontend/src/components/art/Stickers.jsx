// Drei kleine Sticker (Tomate, Blatt, Zitrone) im gleichen Flat-Stil mit weißem Rand.
// Selbst gezeichnet, dekorativ (aria-hidden).

const OUTLINE = { stroke: "#fff", strokeWidth: 9, strokeLinejoin: "round", paintOrder: "stroke" };

export function Tomato(props) {
    return (
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" {...props}>
            <defs>
                <clipPath id="sticker-tomato-clip">
                    <circle cx="60" cy="70" r="42" />
                </clipPath>
            </defs>
            <g {...OUTLINE}>
                <circle cx="60" cy="70" r="42" fill="#d8503b" />
            </g>
            <circle cx="54" cy="64" r="41" fill="#f26b4b" clipPath="url(#sticker-tomato-clip)" />
            <ellipse
                cx="42"
                cy="56"
                rx="9"
                ry="5.5"
                transform="rotate(-35 42 56)"
                fill="#fff"
                opacity="0.45"
            />
            <g {...OUTLINE}>
                <path
                    d="M60 34 L51 20 L57 32 L42 27 L54 38 L38 44 L56 44 L60 55 L64 44 L82 44 L66 38 L78 27 L63 32 L69 20 Z"
                    fill="#2fa866"
                />
            </g>
            <rect x="58" y="12" width="4" height="14" rx="2" fill="#1d7a47" />
        </svg>
    );
}

export function Leaf(props) {
    return (
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" {...props}>
            <g {...OUTLINE}>
                <path d="M22 100 C14 48 52 14 104 16 C108 62 78 106 22 100Z" fill="#2fb872" />
            </g>
            <path d="M104 16 C108 62 78 106 22 100 C56 92 92 62 104 16Z" fill="#1e9d5c" opacity="0.55" />
            <path
                d="M28 94 C50 70 74 46 98 24"
                stroke="#157a47"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M52 72 L48 54 M66 58 L64 42 M46 80 L30 74 M64 68 L80 70"
                stroke="#157a47"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

export function Lemon(props) {
    return (
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" {...props}>
            <g {...OUTLINE}>
                <path
                    d="M14 66 C14 40 42 24 68 28 L82 18 C84 27 83 31 81 35 C98 46 104 64 90 80 C74 98 40 100 24 86 L12 92 C10 84 12 76 14 66Z"
                    fill="#ffc83d"
                />
            </g>
            <path
                d="M70 92 C86 88 96 76 94 64 C98 80 86 98 70 92Z"
                fill="#e9a81c"
                opacity="0.7"
            />
            <path
                d="M30 58 C34 48 46 42 58 42"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.65"
                fill="none"
            />
            <circle cx="40" cy="74" r="2" fill="#e9a81c" />
            <circle cx="56" cy="82" r="2" fill="#e9a81c" />
            <circle cx="70" cy="70" r="2" fill="#e9a81c" />
        </svg>
    );
}
