const modules = [
  {
    prefix: "[Kanban]",
    title: "Aufgaben und Planung",
    description: "Platzhalter fuer Board-Struktur, Spalten und Aufgabenverwaltung.",
  },
  {
    prefix: "[Einkauf/Vorrat]",
    title: "Einkauf und Vorrat",
    description: "Platzhalter fuer Listen, Artikelstatus und Vorratsuebersicht.",
  },
  {
    prefix: "[Kalender]",
    title: "Kalender und Termine",
    description: "Platzhalter fuer Terminverwaltung und spaetere iCal-Integration.",
  },
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">[Core] Monorepo Basis</p>
        <h1>household-app-monorepo</h1>
        <p className="lead">
          Technisches Grundgeruest fuer eine Haushaltsapp als React/FastAPI/PWA-Projekt.
        </p>
      </section>

      <section className="grid">
        {modules.map((module) => (
          <article key={module.prefix} className="card">
            <p className="prefix">{module.prefix}</p>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </section>

      <section className="footnote">
        <p>[Auth] und [DevOps] werden in dieser Phase nur als Grundstruktur vorbereitet.</p>
      </section>
    </main>
  );
}

