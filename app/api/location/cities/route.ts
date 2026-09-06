import { NextResponse } from "next/server";
import { getKnownCities } from "@/lib/location";

// No dynamic API (params/cookies) here to naturally opt this out of
// build-time static prerendering — same fix as /bundles (see its comment).
export const dynamic = "force-dynamic";

export async function GET() {
  const cities = await getKnownCities();
  return NextResponse.json({ cities });
}
