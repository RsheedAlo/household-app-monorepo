// Illustrationen für leere Zustände. Selbst gezeichnet, dekorativ (aria-hidden):
// Der Text daneben sagt, was zu tun ist.

const GHOST = { fill: "none", strokeDasharray: "5 7", strokeLinecap: "round" };

export function EmptyBasket(props) {
    return (
        <svg viewBox="0 0 240 180" aria-hidden="true" focusable="false" {...props}>
            <ellipse cx="120" cy="162" rx="84" ry="9" fill="#064e3b" opacity="0.1" />
            <g {...GHOST} stroke="#059669" strokeWidth="3" opacity="0.7">
                <circle cx="88" cy="70" r="19" />
                <rect x="122" y="38" width="28" height="44" rx="7" />
                <circle cx="168" cy="76" r="14" />
            </g>
            <path
                d="M72 96 C72 40 168 40 168 96"
                fill="none"
                stroke="#059669"
                strokeWidth="9"
                strokeLinecap="round"
            />
            <path
                d="M44 96 H196 L180 150 Q178 158 168 158 H72 Q62 158 60 150 Z"
                fill="#dcf5ea"
                stroke="#059669"
                strokeWidth="5"
                strokeLinejoin="round"
            />
            <g stroke="#059669" strokeWidth="3" opacity="0.45" strokeLinecap="round">
                <path d="M58 114 H182" />
                <path d="M62 132 H178" />
                <path d="M92 98 L86 156" />
                <path d="M120 98 V158" />
                <path d="M148 98 L154 156" />
            </g>
            <path d="M200 34 v18 M191 43 h18" stroke="#ffc83d" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="40" cy="52" r="5" fill="#ffc83d" />
        </svg>
    );
}

export function EmptyShelf(props) {
    return (
        <svg viewBox="0 0 240 180" aria-hidden="true" focusable="false" {...props}>
            <ellipse cx="120" cy="166" rx="92" ry="8" fill="#78350f" opacity="0.1" />
            <path d="M34 85 V148 M206 85 V148" stroke="#d97706" strokeWidth="6" opacity="0.3" />
            <rect x="24" y="76" width="192" height="9" rx="4.5" fill="#d97706" />
            <rect x="24" y="142" width="192" height="9" rx="4.5" fill="#d97706" />

            <rect x="44" y="36" width="42" height="40" rx="9" fill="#fff" stroke="#d97706" strokeWidth="4" />
            <rect x="48" y="26" width="34" height="11" rx="4" fill="#d97706" />
            <path d="M54 46 v18" stroke="#fff0d6" strokeWidth="5" strokeLinecap="round" />

            <rect x="100" y="36" width="42" height="40" rx="9" fill="#fff" stroke="#d97706" strokeWidth="4" />
            <path d="M104 56 H138 V66 a5 5 0 0 1 -5 5 H109 a5 5 0 0 1 -5 -5Z" fill="#ffc83d" />
            <rect x="104" y="26" width="34" height="11" rx="4" fill="#d97706" />

            <rect x="156" y="36" width="42" height="40" rx="9" {...GHOST} stroke="#d97706" strokeWidth="3" />

            <rect x="52" y="104" width="40" height="38" rx="6" fill="#fff0d6" stroke="#d97706" strokeWidth="4" />
            <path d="M52 118 H92" stroke="#d97706" strokeWidth="3" />
            <rect x="152" y="108" width="36" height="34" rx="6" {...GHOST} stroke="#d97706" strokeWidth="3" />

            <path d="M206 28 v16 M198 36 h16" stroke="#ffc83d" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
    );
}

export function EmptyHome(props) {
    return (
        <svg viewBox="0 0 240 180" aria-hidden="true" focusable="false" {...props}>
            <ellipse cx="120" cy="164" rx="92" ry="9" fill="#14349a" opacity="0.1" />
            <rect x="152" y="40" width="14" height="28" rx="3" fill="#1d4ed8" />
            <path
                d="M40 92 L120 28 L200 92"
                fill="#e6edff"
                stroke="#1d4ed8"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <rect x="56" y="88" width="128" height="68" rx="8" fill="#fff" stroke="#1d4ed8" strokeWidth="6" />
            <rect x="106" y="114" width="28" height="42" rx="6" fill="#1d4ed8" />
            <circle cx="128" cy="136" r="2.6" fill="#ffc83d" />
            <rect x="68" y="104" width="26" height="22" rx="5" fill="#e6edff" stroke="#1d4ed8" strokeWidth="4" />
            <rect x="146" y="104" width="26" height="22" rx="5" fill="#e6edff" stroke="#1d4ed8" strokeWidth="4" />
            <rect x="196" y="136" width="20" height="20" rx="4" fill="#d97706" />
            <path d="M206 136 C196 120 198 108 206 100 C214 110 216 122 206 136Z" fill="#059669" />
            <path d="M206 136 C216 124 224 120 230 122 C226 132 218 138 206 136Z" fill="#2fb872" />
            <path d="M34 40 v16 M26 48 h16" stroke="#ffc83d" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
    );
}
