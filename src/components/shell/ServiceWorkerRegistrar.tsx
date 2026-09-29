"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so habit notifications can still surface while
 * the installed app is backgrounded. Without a push server this is best-effort
 * and does not fire when the browser is fully closed.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
