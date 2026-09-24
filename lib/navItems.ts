import {
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Laptop,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

// The site's main categories — one list shared by the desktop category bar,
// the mobile icon strip (components/Header.tsx) and the footer, so the three
// can't drift apart. Events is last because the desktop bar renders it as a
// dropdown of event types rather than a plain link.
export type NavItem = { href: string; label: string; icon: LucideIcon };

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/competitions", label: "Competitions", icon: Trophy },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/jobs?employmentType=INTERNSHIP", label: "Internships", icon: GraduationCap },
  { href: "/freelance", label: "Freelance", icon: Laptop },
  { href: "/events?type=ALUMNI_MEET", label: "Meet Alumni", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
];
