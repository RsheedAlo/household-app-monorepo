// Dekorativer Hintergrund des Dashboard-Heros: überlappende Kreise, Welle, Punktraster, Funkeln.
// Rein dekorativ, daher aria-hidden.
export default function HeroShapes() {
    return (
        <svg
            className="dash-shapes"
            viewBox="0 0 1200 560"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <pattern id="dash-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="3" cy="3" r="2.2" fill="#fff" opacity="0.26" />
                </pattern>
            </defs>

            <circle cx="1040" cy="60" r="340" fill="#2b5cea" />
            <circle cx="1170" cy="500" r="210" fill="#4376f2" opacity="0.5" />
            <circle cx="40" cy="600" r="300" fill="#1941b9" />
            <path
                d="M0 440 C200 380 360 500 600 450 S980 380 1200 470 V560 H0Z"
                fill="#14349a"
                opacity="0.55"
            />

            <rect x="48" y="40" width="200" height="120" fill="url(#dash-dots)" />
            <rect x="900" y="400" width="220" height="110" fill="url(#dash-dots)" />

            {/* Kleine Akzente: auf schmalen Bildschirmen ausgeblendet, damit sie keinen Text kreuzen */}
            <g className="dash-shapes__deco">
                <circle cx="610" cy="74" r="10" fill="#ffc83d" />
                <circle cx="700" cy="132" r="6" fill="#fff" opacity="0.7" />
                <path
                    d="M520 100 l8 -16 l8 16 l16 8 l-16 8 l-8 16 l-8 -16 l-16 -8z"
                    fill="#fff"
                    opacity="0.5"
                />
            </g>
        </svg>
    );
}
