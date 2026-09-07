"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCATION_COOKIE_NAME } from "@/lib/locationConstants";

function readLocationCookie(): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCATION_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setLocationCookie(city: string) {
  const value = encodeURIComponent(city);
  // A year is a reasonable "remember this" horizon for a preference like
  // this — long enough to feel permanent, short enough to eventually
  // re-ask someone who hasn't visited in a long time.
  document.cookie = `${LOCATION_COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function clearLocationCookie() {
  document.cookie = `${LOCATION_COOKIE_NAME}=; path=/; max-age=0`;
}

// Reads the cookie client-side (rather than via a server-passed prop) so
// this component — mounted from the root layout — never forces every
// other page in the app out of static rendering. The one-tick delay
// between the initial "Select location" render and the real value
// (once the effect below runs) is the accepted cost of that.
export function LocationPicker() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCity(readLocationCookie());
  }, []);
  const [cities, setCities] = useState<string[] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureCitiesLoaded() {
    if (cities) return;
    try {
      const res = await fetch("/api/location/cities");
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities);
      }
    } catch {
      // The popover still works without the list — the browser-location
      // button and manual re-entry don't depend on it.
    }
  }

  function apply(nextCity: string) {
    setCity(nextCity);
    setLocationCookie(nextCity);
    setOpen(false);
    router.refresh();
  }

  function clear() {
    setCity(undefined);
    clearLocationCookie();
    setOpen(false);
    router.refresh();
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location detection.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/location/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
          );
          const data = await res.json();
          if (data.city) {
            apply(data.city);
          } else {
            setError("Couldn't determine your city. Please pick one below.");
          }
        } catch {
          setError("Couldn't determine your city. Please pick one below.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setError("Location access was denied. Please pick a city below.");
        setDetecting(false);
      }
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) ensureCitiesLoaded();
        }}
        aria-expanded={open}
        className="flex items-center gap-1 text-sm hover:text-brand-600 dark:hover:text-brand-400"
      >
        📍 {city ?? "Select location"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your location</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Sets your default city for Events, Competitions, and Jobs.
          </p>

          <button
            type="button"
            onClick={useMyLocation}
            disabled={detecting}
            className="mt-3 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm disabled:opacity-50"
          >
            {detecting ? "Detecting…" : "📡 Use my current location"}
          </button>

          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">
              Or choose a city
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) apply(e.target.value);
              }}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
            >
              <option value="">{cities ? "Select a city…" : "Loading…"}</option>
              {cities?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {city && (
            <button
              type="button"
              onClick={clear}
              className="mt-3 text-xs text-gray-500 underline hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              Clear location
            </button>
          )}
        </div>
      )}
    </div>
  );
}
