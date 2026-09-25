import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { PublicProfileToggle } from "@/components/certificates/PublicProfileToggle";
import { DASHBOARD_CARD_CLASS, DashboardShell } from "@/components/dashboard/DashboardShell";
import { profileChecklist, profileCompletionPercent } from "@/lib/profileCompleteness";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      phone: true,
      userType: true,
      organization: true,
      fieldOfStudy: true,
      jobRole: true,
      expertise: true,
      linkedinUrl: true,
      bio: true,
      achievements: true,
      resumeName: true,
      idCardFileName: true,
      photoFileId: true,
      publicProfileEnabled: true,
      name: true,
    },
  });

  const checks = profileChecklist({
    hasPhoto: !!user.photoFileId,
    phone: user.phone,
    organization: user.organization,
    userType: user.userType,
    fieldOfStudy: user.fieldOfStudy,
    jobRole: user.jobRole,
    expertise: user.expertise,
    linkedinUrl: user.linkedinUrl,
    bio: user.bio,
    hasResume: !!user.resumeName,
  });
  const percent = profileCompletionPercent(checks);
  const portfolioUrl = `${SITE_URL}/portfolio/${session.user.id}`;

  return (
    <DashboardShell
      title="Edit profile"
      description="Keep your details up to date — recruiters and course organisers see this information."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <PublicProfileToggle initialEnabled={user.publicProfileEnabled} portfolioUrl={portfolioUrl} />
          <EditProfileForm
            initial={{
              name: user.name,
              hasPhoto: !!user.photoFileId,
              firstName: user.firstName ?? "",
              middleName: user.middleName ?? "",
              lastName: user.lastName ?? "",
              phone: user.phone ?? "",
              userType: user.userType,
              organization: user.organization ?? "",
              fieldOfStudy: user.fieldOfStudy ?? "",
              jobRole: user.jobRole ?? "",
              expertise: user.expertise ?? "",
              linkedinUrl: user.linkedinUrl ?? "",
              bio: user.bio ?? "",
              achievements: Array.isArray(user.achievements) ? (user.achievements as string[]).join(", ") : "",
              resumeName: user.resumeName,
              idCardFileName: user.idCardFileName,
            }}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <div className={`${DASHBOARD_CARD_CLASS} p-5 lg:sticky lg:top-24`}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Profile strength</h2>
              <span className="text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">{percent}%</span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile strength"
            >
              <div
                className={`h-full rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-brand-600"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {percent === 100
                ? "Your profile is complete — nice work."
                : "A complete profile makes your job applications and public portfolio stronger."}
            </p>
            <ul className="mt-4 space-y-1">
              {checks.map((check) => (
                <li key={check.key}>
                  <a
                    href={`#${check.anchor}`}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                      check.done
                        ? "text-slate-400 line-through dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {check.done ? (
                      <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle aria-hidden className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                    {check.label}
                  </a>
                </li>
              ))}
            </ul>
            {user.publicProfileEnabled && (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View your public profile
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
