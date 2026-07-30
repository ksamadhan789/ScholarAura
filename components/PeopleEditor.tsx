"use client";

import type { EventPerson } from "@/lib/eventPeople";

export function PeopleEditor({
  people,
  onChange,
}: {
  people: EventPerson[];
  onChange: (people: EventPerson[]) => void;
}) {
  function updatePerson(index: number, patch: Partial<EventPerson>) {
    onChange(people.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removePerson(index: number) {
    onChange(people.filter((_, i) => i !== index));
  }

  function addPerson() {
    onChange([...people, { role: "Speaker", name: "", designation: "", photoUrl: "" }]);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        Speakers / Patron / Convenor / Coordinator (optional)
      </label>
      <div className="flex flex-col gap-3">
        {people.map((person, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-2 rounded border border-gray-300 dark:border-slate-600 p-3"
          >
            <input
              type="text"
              placeholder="Role (e.g. Speaker, Patron, Convenor, Coordinator)"
              value={person.role}
              onChange={(e) => updatePerson(index, { role: e.target.value })}
              className="col-span-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Full name"
              value={person.name}
              onChange={(e) => updatePerson(index, { name: e.target.value })}
              className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Designation (optional)"
              value={person.designation ?? ""}
              onChange={(e) => updatePerson(index, { designation: e.target.value })}
              className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
            <input
              type="url"
              placeholder="Photo URL (optional)"
              value={person.photoUrl ?? ""}
              onChange={(e) => updatePerson(index, { photoUrl: e.target.value })}
              className="col-span-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removePerson(index)}
              className="col-span-2 justify-self-start text-xs text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addPerson}
        className="mt-2 rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-xs"
      >
        + Add person
      </button>
    </div>
  );
}
