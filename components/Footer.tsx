import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} ScholarAura</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">
            Courses
          </Link>
          <Link href="/events" className="hover:text-brand-600 dark:hover:text-brand-400">
            Events
          </Link>
          <Link href="/verify" className="hover:text-brand-600 dark:hover:text-brand-400">
            Verify a certificate
          </Link>
          <Link href="/admin/login" className="hover:text-brand-600 dark:hover:text-brand-400">
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}
