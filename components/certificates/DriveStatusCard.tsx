import { AlertTriangle, CheckCircle2, HardDrive } from "lucide-react";
import { DisconnectDriveButton } from "@/components/certificates/DisconnectDriveButton";

/**
 * Google Drive connection status for admin pages — everything file-based
 * (certificates, resumes, photos) depends on it. Green when connected,
 * amber with a Connect button when not, plus the ?driveConnected /
 * ?driveError flash from the OAuth callback.
 */
export function DriveStatusCard({
  connectedEmail,
  returnTo,
  purpose,
  missingWarning,
  driveConnected,
  driveError,
}: {
  connectedEmail: string | null;
  returnTo: string;
  /** Shown after the connected email, e.g. "used to store certificates, resumes and profile photos." */
  purpose?: string;
  /** What breaks without a connection. */
  missingWarning: string;
  driveConnected?: string;
  driveError?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          connectedEmail
            ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
        }`}
      >
        <p className="flex items-start gap-3 text-sm">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              connectedEmail
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            <HardDrive aria-hidden className="h-5 w-5" />
          </span>
          {connectedEmail ? (
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Google Drive connected</span> as{" "}
              <span className="font-medium">{connectedEmail}</span>
              {purpose ? ` — ${purpose}` : "."}
            </span>
          ) : (
            <span className="text-amber-800 dark:text-amber-300">
              <span className="font-semibold">No Google Drive account connected</span> — {missingWarning}
            </span>
          )}
        </p>
        {connectedEmail ? (
          <DisconnectDriveButton />
        ) : (
          <a
            href={`/api/admin/google-drive/connect?returnTo=${encodeURIComponent(returnTo)}`}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Connect Google Drive
          </a>
        )}
      </div>
      {driveConnected && (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          Google Drive connected successfully.
        </p>
      )}
      {driveError && (
        <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle aria-hidden className="h-4 w-4" />
          Google Drive connection failed ({driveError}). Please try again.
        </p>
      )}
    </div>
  );
}
