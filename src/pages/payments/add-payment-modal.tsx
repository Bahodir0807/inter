import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddPaymentFormValues, Payment } from '../../entities/payment/api';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { Select } from '../../shared/ui/forms/select';
import { Input } from '../../shared/ui/forms/input';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { Card } from '../../shared/ui/surfaces/card';
import { formatMoney } from '../../shared/lib/date';

const schema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(['cash', 'card', 'transfer']),
  comment: z.string().optional(),
});
type AddPaymentFormInput = z.infer<typeof schema>;

export function AddPaymentModal({
  payment,
  onSubmit,
  onClose,
  isLoading = false,
}: {
  payment: Payment;
  onSubmit: (values: AddPaymentFormValues) => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AddPaymentFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: Math.max(0, payment.remainingAmount), method: 'transfer', comment: '' },
  });

  const amount = watch('amount') || 0;
  return (
    <ModalShell open onClose={onClose} title="Добавить платеж">
      <form onSubmit={handleSubmit(async values => onSubmit(values as AddPaymentFormValues))}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ padding: 12 }}>
            <div>Ожидается: {formatMoney(payment.expectedAmount)}</div>
            <div>Оплачено: {formatMoney(payment.paidAmount)}</div>
            <div>Осталось: {formatMoney(payment.remainingAmount)}</div>
          </div>
        </Card>
        <FormSection title="Данные платежа">
          <Input type="number" min="0.01" step="0.01" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
          <Select {...register('method')} error={errors.method?.message}>
            <option value="cash">cash</option>
            <option value="card">card</option>
            <option value="transfer">transfer</option>
          </Select>
          <Input type="text" {...register('comment')} />
        </FormSection>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ padding: 12 }}>
            <div>Новая сумма: {formatMoney(payment.paidAmount + amount)}</div>
            <div>Осталось: {formatMoney(Math.max(0, payment.remainingAmount - amount))}</div>
          </div>
        </Card>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Отмена</Button>
          <Button type="submit" disabled={isLoading}>Добавить платеж</Button>
        </div>
      </form>
    </ModalShell>
  );
}
