import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Service Worker nur im Produktions-Build: Im Entwicklungsmodus würde er alte Dateien festhalten
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ohne Service Worker läuft die App normal weiter, nur ohne Offline-Hülle
    });
  });
}
