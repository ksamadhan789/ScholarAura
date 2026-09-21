export type HomeCategory = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: string;
  /** Optional real photo/illustration — falls back to the icon + gradient panel when unset. */
  image?: string;
  /** Optional short looping clip — takes priority over `image` when both are set. */
  video?: string;
  /** Key into the stats map returned by getHomeCategoryStats(). */
  statKey: string;
  statLabel: string;
};

// Every href below is an existing route — conferences/webinars/FDPs/training
// all live on the shared /events page filtered by ?type=, there are no
// separate listing pages for them.
export const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: "courses",
    eyebrow: "Courses",
    title: "Courses",
    description: "Build practical academic and professional skills.",
    cta: "Explore Courses",
    href: "/courses",
    icon: "📚",
    video: "/videos/courses.mp4",
    statKey: "courses",
    statLabel: "courses",
  },
  {
    id: "competitions",
    eyebrow: "Competitions",
    title: "Competitions",
    description: "Showcase your knowledge, creativity and skills.",
    cta: "Explore Competitions",
    href: "/competitions",
    icon: "🏆",
    video: "/videos/competitions.mp4",
    statKey: "competitions",
    statLabel: "active competitions",
  },
  {
    id: "international-conferences",
    eyebrow: "Conferences",
    title: "International Conferences",
    description: "Present and connect at global academic conferences.",
    cta: "Explore International Conferences",
    href: "/events?type=INTERNATIONAL_CONFERENCE",
    icon: "🌍",
    video: "/videos/international-conferences.mp4",
    statKey: "internationalConferences",
    statLabel: "upcoming",
  },
  {
    id: "national-conferences",
    eyebrow: "Conferences",
    title: "National Conferences",
    description: "Engage with India's academic and research community.",
    cta: "Explore National Conferences",
    href: "/events?type=NATIONAL_CONFERENCE",
    icon: "🏛️",
    video: "/videos/national-conferences.mp4",
    statKey: "nationalConferences",
    statLabel: "upcoming",
  },
  {
    id: "jobs",
    eyebrow: "Careers",
    title: "Academic & Professional Jobs",
    description: "Discover your next career opportunity.",
    cta: "Explore Jobs",
    href: "/jobs",
    icon: "💼",
    video: "/videos/jobs.mp4",
    statKey: "jobs",
    statLabel: "open roles",
  },
  {
    id: "internships",
    eyebrow: "Careers",
    title: "Internships",
    description: "Gain practical experience and industry exposure.",
    cta: "Explore Internships",
    href: "/jobs?employmentType=INTERNSHIP",
    icon: "🧑‍🎓",
    video: "/videos/internships.mp4",
    statKey: "internships",
    statLabel: "open",
  },
  {
    id: "fdp",
    eyebrow: "Faculty Development",
    title: "Faculty Development",
    description: "Develop teaching, research and professional skills.",
    cta: "Explore FDPs",
    href: "/events?type=FDP",
    icon: "🎓",
    video: "/videos/fdp.mp4",
    statKey: "fdp",
    statLabel: "upcoming",
  },
  {
    id: "webinars",
    eyebrow: "Online",
    title: "Webinars",
    description: "Learn directly from academic and industry experts.",
    cta: "Explore Webinars",
    href: "/events?type=WEBINAR",
    icon: "💻",
    video: "/videos/webinars.mp4",
    statKey: "webinars",
    statLabel: "upcoming",
  },
  {
    id: "hands-on-training",
    eyebrow: "VR Training",
    title: "Hands-on Training",
    description: "Turn knowledge into practical, hands-on experience.",
    cta: "Explore Training",
    href: "/events?type=HANDS_ON_TRAINING",
    icon: "🧪",
    video: "/videos/hands-on-training.mp4",
    statKey: "handsOnTraining",
    statLabel: "upcoming",
  },
  {
    id: "freelance",
    eyebrow: "Marketplace",
    title: "Freelance Opportunities",
    description: "Discover projects and professional opportunities.",
    cta: "Explore Freelance",
    href: "/freelance",
    icon: "🧰",
    video: "/videos/freelance.mp4",
    statKey: "freelance",
    statLabel: "listings",
  },
  {
    id: "meet-alumni",
    eyebrow: "Community",
    title: "Meet Alumni",
    description: "Connect with the ScholarAura academic community.",
    cta: "Meet Alumni",
    href: "/events?type=ALUMNI_MEET",
    icon: "🎉",
    video: "/videos/meet-alumni.mp4",
    statKey: "meetAlumni",
    statLabel: "upcoming",
  },
];

export type HomeCategoryGroup = {
  id: string;
  title: string;
  categoryIds: string[];
};

// Groups the flat category list into themed rows on the homepage, each with
// its own heading under "Explore ScholarAura" — display order below is the
// section order on the page. A category not listed in any group here simply
// wouldn't render, so every id in HOME_CATEGORIES must appear in exactly one.
export const HOME_CATEGORY_GROUPS: HomeCategoryGroup[] = [
  {
    id: "conferences",
    title: "Conferences",
    categoryIds: ["international-conferences", "national-conferences", "webinars", "hands-on-training"],
  },
  {
    id: "opportunities",
    title: "Opportunities",
    categoryIds: ["jobs", "internships", "freelance", "meet-alumni"],
  },
  {
    id: "learning",
    title: "Learning",
    categoryIds: ["courses", "competitions", "fdp"],
  },
];
