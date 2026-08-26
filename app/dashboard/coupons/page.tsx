import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { CreateCouponForm } from "./CreateCouponForm";
import { CouponActions } from "./CouponActions";

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
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Coupons</h1>

      <CreateCouponForm />

      {coupons.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No coupons created yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Discount</th>
                <th className="px-4 py-2.5 font-medium">Applies to</th>
                <th className="px-4 py-2.5 font-medium">Redemptions</th>
                <th className="px-4 py-2.5 font-medium">Expires</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = coupon.expiresAt ? coupon.expiresAt < new Date() : false;
                return (
                  <tr key={coupon.id} className="border-t border-gray-200 dark:border-slate-700">
                    <td className="px-4 py-2.5 font-mono">{coupon.code}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {coupon.discountType === "PERCENT"
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {APPLIES_TO_LABEL[coupon.appliesTo] ?? coupon.appliesTo}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {coupon.redemptionCount}
                      {coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {coupon.expiresAt
                        ? coupon.expiresAt.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {expired ? (
                        <Badge variant="neutral">Expired</Badge>
                      ) : (
                        <Badge variant={coupon.isActive ? "success" : "warning"}>
                          {coupon.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
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
    </main>
  );
}
