import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = registerSchema;

export const applicationSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional().nullable(),
  link: z.string().url().optional().nullable(),
  salaryRange: z.string().optional().nullable(),
  status: z.enum(["Applied", "Interview", "Offer", "Rejected"]).default("Applied"),
  notes: z.string().optional().nullable(),
  dateApplied: z.string().min(1), // ISO date string from form
});