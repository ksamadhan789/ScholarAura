// Canned answers Aura (the guided helper at /aura) checks before falling
// back to a live keyword search across courses/events/competitions/jobs/
// freelance listings. No LLM involved — just keyword matching, so this stays
// free to run and instant to respond.
export type FaqEntry = {
  keywords: string[];
  answer: string;
  href?: string;
  linkLabel?: string;
};

export const AURA_FAQ: FaqEntry[] = [
  {
    keywords: ["certificate", "certification", "verify"],
    answer:
      "Certificates are issued automatically once you complete a course, attend an event, or finish a competition (and meet any attendance or quiz requirements). Anyone can verify a certificate's authenticity publicly.",
    href: "/verify",
    linkLabel: "Verify a certificate",
  },
  {
    keywords: ["refund"],
    answer:
      "You can request a refund from your dashboard for any paid course, event, or competition you've registered for.",
    href: "/dashboard/registrations",
    linkLabel: "Go to my registrations",
  },
  {
    keywords: ["internship", "intern"],
    answer: "Internships are listed right alongside regular jobs — just filter by type.",
    href: "/jobs?employmentType=INTERNSHIP",
    linkLabel: "Browse internships",
  },
  {
    keywords: ["freelance", "gig", "freelancer"],
    answer:
      "You can browse freelance services offered by other students and professionals, or post your own.",
    href: "/freelance",
    linkLabel: "Browse freelance",
  },
  {
    keywords: ["alumni"],
    answer: "Alumni Meets are a type of event for networking with fellow alumni.",
    href: "/events?type=ALUMNI_MEET",
    linkLabel: "Browse Alumni Meets",
  },
  {
    keywords: ["referral", "refer a friend", "earn credit"],
    answer: "Refer friends with your referral link and earn credit when they make a purchase.",
    href: "/dashboard/referrals",
    linkLabel: "Get my referral link",
  },
  {
    keywords: ["wishlist", "save for later", "saved item"],
    answer: "Tap the heart icon on any course, event, competition, or job to save it for later.",
    href: "/dashboard/wishlist",
    linkLabel: "View saved items",
  },
  {
    keywords: ["coupon", "discount", "promo code"],
    answer:
      "Apply a coupon code at checkout on any paid course, event, or competition to get a discount.",
  },
];

export function matchAuraFaq(query: string): FaqEntry | null {
  const q = query.toLowerCase();
  return AURA_FAQ.find((entry) => entry.keywords.some((k) => q.includes(k))) ?? null;
}
