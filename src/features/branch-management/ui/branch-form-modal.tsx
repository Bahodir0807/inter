import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Branch, BranchFormValues } from '../../../entities/branch/api';
import { branchFormSchema as sharedBranchFormSchema } from '../../../shared/lib/schemas/branch-schema';
import { Button } from '../../../shared/ui/buttons';
import { Input, Select } from '../../../shared/ui/forms';
import { FormSection } from '../../../shared/ui/forms/form-section';
import { ModalShell } from '../../../shared/ui/overlay/modal-shell';
import { useI18n } from '../../../shared/i18n/i18n';

const schema = sharedBranchFormSchema.extend({
  isActive: z.enum(['true', 'false']),
  status: z.string().optional(),
});

type BranchFormInput = z.input<typeof schema>;
type BranchFormOutput = z.output<typeof schema>;

interface BranchFormModalProps {
  branch: Branch | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: BranchFormValues) => Promise<void>;
}

export function BranchFormModal({ branch, open, loading, onClose, onSubmit }: BranchFormModalProps) {
  const { t } = useI18n();
  const {
    register,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<BranchFormInput, unknown, BranchFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      isActive: 'true',
      status: 'active',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: branch?.name ?? '',
      address: branch?.address ?? '',
      phone: branch?.phone ?? '',
      isActive: String(branch?.isActive ?? true) as 'true' | 'false',
      status: branch?.status ?? 'active',
    });
    window.setTimeout(() => setFocus('name'), 0);
  }, [branch, open, reset, setFocus]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      closeDisabled={loading}
      title={t('branches.edit')}
      description={t('branches.formDescription')}
    >
      <form
        className="modal-form"
        onSubmit={handleSubmit(async values => onSubmit({
          name: values.name.trim(),
          address: values.address?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          isActive: values.isActive === 'true',
          status: values.status?.trim() || undefined,
        }))}
      >
        <FormSection title={t('branches.manage')} description={t('branches.formSectionDescription')}>
          <Input
            label={t('branches.name')}
            error={errors.name?.message ? t(errors.name.message) : undefined}
            fieldClassName="ui-field--primary"
            {...register('name')}
          />
          <div className="detail-grid">
            <Input label={t('branches.address')} {...register('address')} />
            <Input label={t('branches.phone')} {...register('phone')} />
            <Select label={t('branches.status')} {...register('isActive')}>
              <option value="true">{t('branches.active')}</option>
              <option value="false">{t('branches.inactive')}</option>
            </Select>
          </div>
          <Input label={t('branches.status')} {...register('status')} />
        </FormSection>
        <div className="form-actions">
          <span className="subtle">{isDirty ? t('common.changesReadyToSave') : t('branches.formHint')}</span>
          <div className="inline-actions">
            <Button type="submit" disabled={loading || !isDirty || !isValid}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}