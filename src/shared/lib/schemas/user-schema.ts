import { z } from 'zod';

export const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().trim().min(1, 'Name is required'),
  role: z.enum(['owner', 'admin', 'manager', 'teacher']),
});

export type UserFormValues = z.infer<typeof userFormSchema>;