import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().trim().min(1, 'Branch name is required'),
  address: z.string().trim().min(1, 'Address is required'),
  phone: z.string().optional(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;