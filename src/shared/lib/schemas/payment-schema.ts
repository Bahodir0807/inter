import { z } from 'zod';
export const paymentFormSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  date: z.string(),
});
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;