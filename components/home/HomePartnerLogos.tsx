import { PARTNERS } from "@/lib/partners";

// "Trusted by" logo strip. Driven by lib/partners.ts; renders nothing until
// a real partner is listed there.
export function HomePartnerLogos() {
  if (PARTNERS.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 pb-12">
      <p className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Trusted by institutions and companies
      </p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {PARTNERS.map((partner) => {
          // eslint-disable-next-line @next/next/no-img-element
          const logo = <img src={partner.logo} alt={partner.name} className="h-12 w-auto max-w-[160px] object-contain" />;
          return (
            <li key={partner.name} title={partner.name}>
              {partner.href ? (
                <a href={partner.href} target="_blank" rel="noopener noreferrer">
                  {logo}
                </a>
              ) : (
                logo
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
