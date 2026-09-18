import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditFreelanceListingForm } from "./EditFreelanceListingForm";

export default async function EditFreelanceListingPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const listing = await prisma.freelanceListing.findUnique({ where: { slug: params.slug } });
  if (!listing) notFound();
  if (listing.postedByUserId !== session.user.id) redirect("/dashboard/freelance");

  const skills = Array.isArray(listing.skills) ? (listing.skills as string[]) : [];

  return (
    <EditFreelanceListingForm
      slug={listing.slug}
      initial={{
        title: listing.title,
        category: listing.category,
        description: listing.description,
        skills: skills.join(", "),
        rate: listing.rate ?? "",
        portfolioUrl: listing.portfolioUrl ?? "",
        contactEmail: listing.contactEmail,
      }}
    />
  );
}
