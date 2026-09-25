import Link from "next/link";
import { RotateCcw, ShieldCheck } from "lucide-react";

/**
 * Small reassurance lines under a paid item's buy button. Every line must
 * stay literally true: the refund wording mirrors /refund-policy (courses:
 * 7 days from purchase; events: cancel 7+ days before the start), and
 * competitions aren't covered there, so they pass no refund note.
 */
export function CheckoutAssurance({ refundNote }: { refundNote?: string }) {
  return (
    <ul className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <li className="flex items-center gap-1.5">
        <ShieldCheck aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        Secure payment by Razorpay
      </li>
      {refundNote && (
        <li className="flex items-center gap-1.5">
          <RotateCcw aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            {refundNote}{" "}
            <Link href="/refund-policy" className="underline hover:text-slate-700 dark:hover:text-slate-200">
              Refund policy
            </Link>
          </span>
        </li>
      )}
    </ul>
  );
}
