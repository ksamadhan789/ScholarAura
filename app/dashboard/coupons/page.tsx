import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { CreateCouponForm } from "./CreateCouponForm";
import { CouponActions } from "./CouponActions";
import { Tag } from "lucide-react";
import { DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";

const APPLIES_TO_LABEL: Record<string, string> = {
  ALL: "Everything",
  COURSE: "Courses",
  EVENT: "Events",
  COMPETITION: "Competitions",
};

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <DashboardShell
      title="Coupons"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Discount codes buyers enter at checkout. A coupon that's been used can be deactivated but not deleted."
    >
      <CreateCouponForm />

      {coupons.length === 0 ? (
        <DashboardEmptyState icon={Tag} title="No coupons yet" text="Create your first one above." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Applies to</th>
                <th className="px-4 py-3 font-semibold">Redemptions</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = coupon.expiresAt ? coupon.expiresAt < new Date() : false;
                return (
                  <tr key={coupon.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{coupon.code}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {coupon.discountType === "PERCENT" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {APPLIES_TO_LABEL[coupon.appliesTo] ?? coupon.appliesTo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {coupon.redemptionCount}
                      {coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {coupon.expiresAt
                        ? coupon.expiresAt.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Kolkata",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {expired ? (
                        <Badge variant="neutral">Expired</Badge>
                      ) : (
                        <Badge variant={coupon.isActive ? "success" : "warning"}>
                          {coupon.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CouponActions
                        id={coupon.id}
                        isActive={coupon.isActive}
                        redemptionCount={coupon.redemptionCount}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
