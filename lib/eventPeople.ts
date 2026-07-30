import { z } from "zod";

export type EventPerson = {
  role: string;
  name: string;
  designation?: string;
  photoUrl?: string;
};

export const eventPersonSchema = z.object({
  role: z.string().trim().min(1, "Role is required"),
  name: z.string().trim().min(1, "Name is required"),
  designation: z.string().trim().optional().or(z.literal("")),
  photoUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
});

export const eventPeopleSchema = z.array(eventPersonSchema).optional();
