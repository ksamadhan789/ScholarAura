import type { EventPerson } from "@/lib/eventPeople";

export function PeopleList({
  people,
  title = "Organizing Committee",
}: {
  people: EventPerson[];
  title?: string;
}) {
  if (people.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {people.map((person, index) => (
          <div
            key={index}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photoUrl}
                alt={person.name}
                className="h-20 w-20 rounded-full object-cover shadow-md ring-4 ring-white dark:ring-slate-900"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-500 shadow-md ring-4 ring-white dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-900">
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {person.role}
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{person.name}</p>
            {person.designation && (
              <p className="text-xs text-gray-500 dark:text-slate-400">{person.designation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
