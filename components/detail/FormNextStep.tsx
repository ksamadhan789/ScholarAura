import { ClipboardList, ExternalLink } from "lucide-react";

/**
 * "One step left" prompt linking to the organiser's Google Form. Shown right
 * after a registration/entry succeeds and on the detail page until the form
 * is submitted. A plain link the person clicks themselves, so popup
 * blockers never swallow it.
 */
export function FormNextStep({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
      <p className="flex items-start gap-2 font-medium text-amber-900 dark:text-amber-200">
        <ClipboardList aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        One step left: complete the organiser&rsquo;s registration form.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        Open the Google Form
        <ExternalLink aria-hidden className="h-4 w-4" />
      </a>
    </div>
  );
}
