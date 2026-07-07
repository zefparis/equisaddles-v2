import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[MAIN] PWA DÉSACTIVÉ - Version développement LIVE - " + new Date().toISOString());

// DÉSACTIVER COMPLÈTEMENT LE SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('[PWA] Service Worker SUPPRIMÉ pour développement');
    });
  });
  
  // Supprimer TOUS les caches
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      caches.delete(cacheName);
      console.log('[PWA] Cache supprimé:', cacheName);
    });
  });
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Failed to find root element");
}