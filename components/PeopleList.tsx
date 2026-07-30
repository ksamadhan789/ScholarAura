import type { EventPerson } from "@/lib/eventPeople";

export function PeopleList({ people }: { people: EventPerson[] }) {
  if (people.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {people.map((person, index) => (
        <div key={index} className="flex flex-col items-center text-center">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={person.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-lg font-semibold text-gray-500 dark:text-slate-400">
              {person.name.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {person.role}
          </p>
          <p className="text-sm font-medium">{person.name}</p>
          {person.designation && (
            <p className="text-xs text-gray-500 dark:text-slate-400">{person.designation}</p>
          )}
        </div>
      ))}
    </div>
  );
}
