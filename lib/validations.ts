import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const bookSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(1000),
  author: z.string().trim().min(2).max(100),
  genre: z.string().trim().min(2).max(50),
  rating: z.coerce.number().min(1).max(5),
  totalCopies: z.coerce.number().int().positive().lte(10000),
  coverUrl: z.string().nonempty(),
  coverColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-F]{6}$/i),
  videoUrl: z.string().nonempty(),
  summary: z.string().trim().min(10),
});

export const appointmentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z
    .string()
    .regex(
      /^09\d{9}$/,
      "Mobile number must be a valid PH number (e.g., 09171234567)",
    ),

  appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),

  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "Time must be in HH:MM (24-hour) format",
  }),

  branch: z.string().min(1, "Branch is required"),

  barber: z.string().min(1, "Barber is required"),

  services: z.string().min(1, "Service is required"),
});
