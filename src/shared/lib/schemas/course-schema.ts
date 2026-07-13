import { z } from 'zod';

export const courseFormSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required'),
  price: z.number().min(0, 'Price cannot be negative'),
  durationMonths: z.number().min(1, 'Duration must be at least 1 month'),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;