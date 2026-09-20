import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { PublicProfileToggle } from "@/components/certificates/PublicProfileToggle";
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
      publicProfileEnabled: true,
    },
  });

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-16">
      <h1 className="text-2xl font-semibold">👤 Edit profile</h1>
      <p className="mt-2 text-gray-600 dark:text-slate-400">
        Keep your details up to date — recruiters and course organizers see this information.
      </p>

      <div className="mt-8">
        <PublicProfileToggle
          initialEnabled={user.publicProfileEnabled}
          portfolioUrl={`${SITE_URL}/portfolio/${session.user.id}`}
        />
      </div>

      <div className="mt-6">
        <EditProfileForm
          initial={{
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
            achievements: Array.isArray(user.achievements)
              ? (user.achievements as string[]).join(", ")
              : "",
            resumeName: user.resumeName,
          }}
        />
      </div>
    </main>
  );
}
