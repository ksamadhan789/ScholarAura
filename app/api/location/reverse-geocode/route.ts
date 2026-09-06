import { NextResponse } from "next/server";

// Uses OpenStreetMap's Nominatim — free and keyless, unlike Google Maps'
// geocoding API, so there's nothing new to sign up for or configure. Its
// usage policy just requires a real User-Agent identifying the app, which
// the browser can't set itself, so this proxies the request server-side.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

type NominatimResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ScholarAura/1.0 (https://scholaraura.com)" },
    });
    if (!res.ok) {
      return NextResponse.json({ city: null });
    }

    const data = (await res.json()) as NominatimResponse;
    const city =
      data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? null;

    return NextResponse.json({ city });
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return NextResponse.json({ city: null });
  }
}
