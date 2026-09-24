// Canned answers Aura (the guided helper at /aura) checks before falling
// back to a live keyword search across courses/events/competitions/jobs/
// freelance listings. No LLM involved — just keyword matching, so this stays
// free to run and instant to respond.
export type FaqEntry = {
  keywords: string[];
  /** The entry phrased as a question, for the public /faq page. */
  question: string;
  /** Which /faq section it's listed under. */
  group: "learning" | "events" | "careers" | "account";
  answer: string;
  href?: string;
  linkLabel?: string;
};

export const AURA_FAQ: FaqEntry[] = [
  {
    keywords: ["certificate", "certification", "verify"],
    question: "How do I get a certificate, and can someone verify it?",
    group: "learning",
    answer:
      "Certificates are issued automatically once you complete a course, attend an event, or finish a competition (and meet any attendance or quiz requirements). Anyone can verify a certificate's authenticity publicly.",
    href: "/verify",
    linkLabel: "Verify a certificate",
  },
  {
    keywords: ["refund"],
    question: "How do I get a refund?",
    group: "account",
    answer:
      "You can request a refund from your dashboard for any paid course, event, or competition you've registered for.",
    href: "/dashboard/registrations",
    linkLabel: "Go to my registrations",
  },
  {
    keywords: ["internship", "intern"],
    question: "Where can I find internships?",
    group: "careers",
    answer: "Internships are listed right alongside regular jobs — just filter by type.",
    href: "/jobs?employmentType=INTERNSHIP",
    linkLabel: "Browse internships",
  },
  {
    keywords: ["freelance", "gig", "freelancer"],
    question: "What is the Freelance section?",
    group: "careers",
    answer:
      "You can browse freelance services offered by other students and professionals, or post your own.",
    href: "/freelance",
    linkLabel: "Browse freelance",
  },
  {
    keywords: ["alumni"],
    question: "What is Meet Alumni?",
    group: "events",
    answer: "Meet Alumni is a type of event for networking with fellow alumni.",
    href: "/events?type=ALUMNI_MEET",
    linkLabel: "Browse Meet Alumni events",
  },
  {
    keywords: ["referral", "refer a friend", "earn credit"],
    question: "How does Refer & Earn work?",
    group: "account",
    answer: "Refer friends with your referral link and earn credit when they make a purchase.",
    href: "/dashboard/referrals",
    linkLabel: "Get my referral link",
  },
  {
    keywords: ["wishlist", "save for later", "saved item"],
    question: "How do I save something for later?",
    group: "account",
    answer: "Tap the heart icon on any course, event, competition, or job to save it for later.",
    href: "/dashboard/wishlist",
    linkLabel: "View saved items",
  },
  {
    keywords: ["coupon", "discount", "promo code"],
    question: "How do I use a coupon code?",
    group: "account",
    answer:
      "Apply a coupon code at checkout on any paid course, event, or competition to get a discount.",
  },
  {
    keywords: ["enroll", "sign up for a course", "join a course"],
    question: "How do I enroll in a course?",
    group: "learning",
    answer: "Open any course and hit the enroll button — it's instant for free courses, or after payment for paid ones.",
    href: "/courses",
    linkLabel: "Browse courses",
  },
  {
    keywords: ["quiz", "quizzes"],
    question: "How do course quizzes work?",
    group: "learning",
    answer:
      "Courses can have a quiz after each lecture and a final quiz — you need to pass them to unlock that course's certificate.",
  },
  {
    keywords: ["resource", "course material", "download material", "download notes"],
    question: "Where do I find course notes and materials?",
    group: "learning",
    answer: "Downloadable resources (notes, slides, files) live on the course's own page, under each lecture that has them.",
  },
  {
    keywords: ["waitlist"],
    question: "What happens if an event is full?",
    group: "events",
    answer: "If an event is fully booked, you can join its waitlist and you'll be notified if a seat opens up.",
    href: "/events",
    linkLabel: "Browse events",
  },
  {
    keywords: ["team size", "team competition", "teammate"],
    question: "Can I enter a competition as a team?",
    group: "events",
    answer: "Some competitions allow team entries — check the competition's page for its max team size.",
    href: "/competitions",
    linkLabel: "Browse competitions",
  },
  {
    keywords: ["apply for a job", "job application", "how do i apply"],
    question: "How do I apply for a job?",
    group: "careers",
    answer: "Open a job listing and apply directly with a PDF resume — you can track your application status from your dashboard.",
    href: "/jobs",
    linkLabel: "Browse jobs",
  },
  {
    keywords: ["recruiter", "post a job", "hire talent", "hiring"],
    question: "How do I post a job as a recruiter?",
    group: "careers",
    answer: "Recruiters can register to post jobs — every posting needs admin approval before it goes live.",
    href: "/recruiter/register",
    linkLabel: "Register as a recruiter",
  },
  {
    keywords: ["boost my job", "featured job", "promote my job", "boost a job"],
    question: "How do I feature (boost) my job posting?",
    group: "careers",
    answer: "Recruiters can pay to feature a job posting for 30 days, pinning it to the top of the jobs page.",
  },
  {
    keywords: ["message a recruiter", "chat with recruiter", "messaging"],
    question: "Can I message a recruiter?",
    group: "careers",
    answer: "You can message a recruiter directly from your job application, and freelance clients can message you from your listing.",
    href: "/dashboard/job-applications",
    linkLabel: "Go to my applications",
  },
  {
    keywords: ["location", "select location", "change city"],
    question: "How do I change my city?",
    group: "account",
    answer: "Set your city from the location picker in the header — it pre-filters events, competitions, and jobs near you.",
  },
  {
    keywords: ["notification"],
    question: "Where do I see my notifications?",
    group: "account",
    answer: "The bell icon in the header shows your notifications — new messages, application updates, and more.",
  },
  {
    keywords: ["portfolio", "public profile"],
    question: "What is my public portfolio?",
    group: "account",
    answer: "Your dashboard has a public portfolio page showing your verified certificates — you can toggle whether it's public.",
    href: "/dashboard/certificates",
    linkLabel: "Manage my certificates",
  },
  {
    keywords: ["dark mode", "light mode", "theme"],
    question: "How do I switch between light and dark mode?",
    group: "account",
    answer: "Toggle light/dark mode from the moon/sun icon in the header — it's dark by default, and remembers your choice.",
  },
  {
    keywords: ["forgot password", "reset password", "change password"],
    question: "I forgot my password. What do I do?",
    group: "account",
    answer: "You can reset your password from the login page.",
    href: "/forgot-password",
    linkLabel: "Reset my password",
  },
  {
    keywords: ["sign in with google", "google sign"],
    question: "Can I sign in with Google?",
    group: "account",
    answer: "You can sign in with Google or with your email and password — both are on the login page.",
    href: "/login",
    linkLabel: "Go to login",
  },
  {
    keywords: ["currency", "exchange rate", "pay in dollars", "pay in usd"],
    question: "Can I see prices in another currency?",
    group: "account",
    answer: "Prices show in multiple currencies using live exchange rates — charging in a non-INR currency depends on the payment method available.",
  },
  {
    keywords: ["cancel my registration", "cancel registration"],
    question: "How do I cancel an event or competition registration?",
    group: "events",
    answer: "You can cancel a free event registration from your dashboard, as long as the event hasn't started yet.",
    href: "/dashboard/registrations",
    linkLabel: "Go to my registrations",
  },
  {
    keywords: ["post freelance", "post a gig", "offer my services", "list my services"],
    question: "How do I offer my own services as a freelancer?",
    group: "careers",
    answer: "Post your own freelance listing (design, tutoring, dev work, and more) — it publishes immediately, no approval needed.",
    href: "/dashboard/freelance",
    linkLabel: "Post a freelance listing",
  },
];

export function matchAuraFaq(query: string): FaqEntry | null {
  const q = query.toLowerCase();
  return AURA_FAQ.find((entry) => entry.keywords.some((k) => q.includes(k))) ?? null;
}
