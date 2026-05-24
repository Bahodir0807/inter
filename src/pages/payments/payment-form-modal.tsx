import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Course } from '../../entities/course/api';
import { Group } from '../../entities/group/api';
import { CreatePaymentFormValues } from '../../entities/payment/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { Select } from '../../shared/ui/forms/select';
import { Input } from '../../shared/ui/forms/input';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getGroupDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { useI18n } from '../../shared/i18n/i18n';

const schema = z.object({
  studentId: z.string().min(1, 'payments.validation.student'),
  courseId: z.string().min(1, 'payments.validation.course'),
  groupId: z.string().min(1, 'payments.validation.group'),
  branchId: z.string().min(1, 'payments.validation.branch'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  expectedAmount: z.number().min(0),
  paidAmount: z.number().min(0),
  paymentMethod: z.enum(['cash', 'card', 'transfer']).optional(),
  comment: z.string().optional(),
});

type PaymentFormInput = z.infer<typeof schema>;

export function PaymentFormModal({
  students = [],
  courses = [],
  groups = [],
  onSubmit,
  onClose,
  isLoading = false,
}: {
  students: AppUser[];
  courses: Course[];
  groups: Group[];
  onSubmit: (values: CreatePaymentFormValues) => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}) {
  const { t } = useI18n();
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: '',
      courseId: '',
      groupId: '',
      branchId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      expectedAmount: 0,
      paidAmount: 0,
      paymentMethod: 'transfer',
      comment: '',
    },
  });

  return (
    <ModalShell open title={t('payments.createTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit(async values => onSubmit(values as CreatePaymentFormValues))}>
        <FormSection title={t('payments.studentInfo')}>
          <Select {...register('studentId')} error={errors.studentId?.message}>
            <option value="">{t('payments.validation.student')}</option>
            {students.map(s => <option key={s.id} value={s.id}>{getUserDisplayName(s)}</option>)}
          </Select>
          <Input {...register('branchId')} error={errors.branchId?.message} label={t('payments.branch')} />
        </FormSection>

        <FormSection title={t('payments.courseInfo')}>
          <Select {...register('courseId')} error={errors.courseId?.message}>
            <option value="">{t('payments.validation.course')}</option>
            {courses.map(c => <option key={c.id} value={c.id}>{getCourseDisplayName(c)}</option>)}
          </Select>
          <Select {...register('groupId')} error={errors.groupId?.message}>
            <option value="">{t('payments.validation.group')}</option>
            {groups.map(g => <option key={g.id} value={g.id}>{getGroupDisplayName(g)}</option>)}
          </Select>
        </FormSection>

        <FormSection title={t('payments.period')}>
          <Input type="number" label={t('payments.month')} {...register('month', { valueAsNumber: true })} error={errors.month?.message} />
          <Input type="number" label={t('payments.year')} {...register('year', { valueAsNumber: true })} error={errors.year?.message} />
        </FormSection>

        <FormSection title={t('payments.amounts')}>
          <Input type="number" label={t('payments.expectedAmount')} {...register('expectedAmount', { valueAsNumber: true })} error={errors.expectedAmount?.message} />
          <Input type="number" label={t('payments.paidAmount')} {...register('paidAmount', { valueAsNumber: true })} error={errors.paidAmount?.message} />
        </FormSection>

        <FormSection title={t('payments.paymentDetails')}>
          <Select {...register('paymentMethod')} error={errors.paymentMethod?.message}>
            <option value="transfer">transfer</option>
            <option value="cash">cash</option>
            <option value="card">card</option>
          </Select>
          <Input type="text" label={t('common.comment')} {...register('comment')} />
        </FormSection>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? t('common.saving') : t('common.create')}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
