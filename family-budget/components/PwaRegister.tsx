"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // Keep production responsive to frequent UI/data fixes:
    // unregister old SW caches that may hold stale bundles.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => undefined);
    }
  }, []);

  return null;
}
