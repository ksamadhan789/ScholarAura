// Institutions and companies shown in the homepage "Trusted by" logo strip
// (components/home/HomePartnerLogos.tsx). Only list organisations that have
// actually worked with ScholarAura and agreed to be named. Put the logo file
// in public/logos/ and reference it as "/logos/<file>". An empty list hides
// the strip entirely.
export type Partner = { name: string; logo: string; href?: string };

export const PARTNERS: Partner[] = [];
