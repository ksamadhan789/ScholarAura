import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
    >
      {children}
    </Link>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-slate-400">{title}</h2>
      <div className="flex flex-wrap gap-3">{children}</div>
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

  if (isStudent) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompletedAt: true, fieldOfStudy: true },
    });
    if (!user?.onboardingCompletedAt) {
      redirect("/onboarding");
    }

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">
        👋 Welcome, {session.user?.name ?? session.user?.email}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-slate-400">
        Signed in as <strong>{session.user?.email}</strong> · Role:{" "}
        <strong>{session.user?.role}</strong>
      </p>

      {isNewUser && (
        <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/20">
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

      <div className="mt-8 flex flex-col gap-6">
        <NavGroup title="Learning">
          <NavLink href="/courses">📚 Browse courses</NavLink>
          <NavLink href="/dashboard/learning">🎓 My learning</NavLink>
          {isInstructor && (
            <NavLink href="/dashboard/courses">🧑‍🏫 My courses (instructor)</NavLink>
          )}
          <NavLink href="/dashboard/certificates">📜 My certificates</NavLink>
        </NavGroup>

        <NavGroup title="Events & competitions">
          <NavLink href="/events">📅 Browse events</NavLink>
          <NavLink href="/dashboard/registrations">🗓️ My events</NavLink>
          <NavLink href="/competitions">🏆 Browse competitions</NavLink>
          <NavLink href="/dashboard/entries">🏆 My competitions</NavLink>
        </NavGroup>

        <NavGroup title="Jobs">
          <NavLink href="/jobs">💼 Browse jobs</NavLink>
          <NavLink href="/dashboard/job-applications">💼 My applications</NavLink>
        </NavGroup>

        <NavGroup title="Other">
          <NavLink href="/dashboard/referrals">🎁 Refer & earn</NavLink>
        </NavGroup>
      </div>
    </main>
  );
}
