import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";

function TileLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg dark:bg-brand-900/30"
      >
        {icon}
      </span>
      {children}
    </Link>
  );
}

function TileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }
  if (session.user.role === "RECRUITER") {
    redirect("/dashboard/recruiter");
  }

  const isStudent = session.user.role === "STUDENT";
  const isInstructor = session.user.role === "INSTRUCTOR";

  let isNewUser = false;
  let recommendedCourses: { slug: string; title: string; category: string }[] = [];
  let organization: string | null = null;
  let headline: string | null = null;

  if (isStudent) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompletedAt: true,
        fieldOfStudy: true,
        jobRole: true,
        organization: true,
      },
    });
    if (!user?.onboardingCompletedAt) {
      redirect("/onboarding");
    }

    organization = user.organization ?? null;
    headline = user.fieldOfStudy ?? user.jobRole ?? null;

    const [purchaseCount, registrationCount, entryCount, applicationCount] = await Promise.all([
      prisma.coursePurchase.count({ where: { userId: session.user.id, status: "SUCCESS" } }),
      prisma.eventRegistration.count({ where: { userId: session.user.id, status: "CONFIRMED" } }),
      prisma.competitionEntry.count({ where: { userId: session.user.id, status: "SUCCESS" } }),
      prisma.jobApplication.count({ where: { userId: session.user.id } }),
    ]);
    isNewUser =
      purchaseCount === 0 && registrationCount === 0 && entryCount === 0 && applicationCount === 0;

    if (isNewUser && user?.fieldOfStudy) {
      recommendedCourses = await prisma.course.findMany({
        where: {
          isPublished: true,
          OR: [
            { category: { contains: user.fieldOfStudy, mode: "insensitive" } },
            { title: { contains: user.fieldOfStudy, mode: "insensitive" } },
          ],
        },
        select: { slug: true, title: true, category: true },
        take: 3,
      });
    }
  }

  const displayName = session.user?.name ?? session.user?.email ?? "there";
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { photoFileId: true, publicProfileEnabled: true },
  });

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-16">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={displayName}
            src={currentUser?.photoFileId ? "/api/account/photo" : null}
            size={56}
          />
          <div>
            <h1 className="text-xl font-semibold">👋 Welcome, {displayName}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {session.user?.email} · <strong>{session.user?.role}</strong>
              {organization && <> · {organization}</>}
              {headline && <> · {headline}</>}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {currentUser?.publicProfileEnabled && (
            <Link
              href={`/portfolio/${session.user.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              👤 View profile
            </Link>
          )}
          <Link
            href="/dashboard/profile"
            className="w-fit rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            ✏️ Edit profile
          </Link>
        </div>
      </div>

      {isNewUser && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/20">
          <h2 className="font-semibold text-slate-900 dark:text-white">Let&rsquo;s get you started</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            You haven&rsquo;t enrolled in anything yet — here&rsquo;s where most people begin.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
            >
              📚 Browse courses
            </Link>
            <Link
              href="/events"
              className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
            >
              📅 Browse events
            </Link>
            <Link
              href="/competitions"
              className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
            >
              🏆 Browse competitions
            </Link>
          </div>

          {recommendedCourses.length > 0 && (
            <div className="mt-5 border-t border-brand-200 dark:border-brand-800 pt-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Recommended for you
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {recommendedCourses.map((course) => (
                  <Link
                    key={course.slug}
                    href={`/courses/${course.slug}`}
                    className="text-sm text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {course.title} — {course.category}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8">
        <TileGroup title="Learning">
          <TileLink href="/courses" icon="📚">
            Browse courses
          </TileLink>
          <TileLink href="/dashboard/learning" icon="🎓">
            My learning
          </TileLink>
          {isInstructor && (
            <TileLink href="/dashboard/courses" icon="🧑‍🏫">
              My courses (instructor)
            </TileLink>
          )}
          <TileLink href="/dashboard/certificates" icon="📜">
            My certificates
          </TileLink>
          <TileLink href="/dashboard/wishlist" icon="❤️">
            Saved for later
          </TileLink>
        </TileGroup>

        <TileGroup title="Events & competitions">
          <TileLink href="/events" icon="📅">
            Browse events
          </TileLink>
          <TileLink href="/dashboard/registrations" icon="🗓️">
            My events
          </TileLink>
          <TileLink href="/competitions" icon="🏆">
            Browse competitions
          </TileLink>
          <TileLink href="/dashboard/entries" icon="🏆">
            My competitions
          </TileLink>
        </TileGroup>

        <TileGroup title="Jobs">
          <TileLink href="/jobs" icon="💼">
            Browse jobs
          </TileLink>
          <TileLink href="/dashboard/job-applications" icon="💼">
            My applications
          </TileLink>
        </TileGroup>

        <TileGroup title="Freelance">
          <TileLink href="/freelance" icon="🧰">
            Browse freelance
          </TileLink>
          <TileLink href="/dashboard/freelance" icon="🧰">
            My listings
          </TileLink>
          <TileLink href="/dashboard/freelance/messages" icon="💬">
            My messages
          </TileLink>
        </TileGroup>

        <TileGroup title="Other">
          <TileLink href="/dashboard/referrals" icon="🎁">
            Refer & earn
          </TileLink>
        </TileGroup>
      </div>
    </main>
  );
}
