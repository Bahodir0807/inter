import { z } from 'zod';

export const studentFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phoneNumber: z.string().regex(/^\+?\d+$/, 'Invalid phone number format').optional(),
  telegramId: z.string().optional(),
  parentPhoneNumber: z.string().optional(),
  parentName: z.string().optional(),
  groupIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  monthlyPayment: z.number().min(0).optional(),
  paymentDueDate: z.string().optional(),
  comment: z.string().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;