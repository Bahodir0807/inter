import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Room, RoomFormValues } from '../../entities/room/api';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { Textarea } from '../../shared/ui/forms/textarea';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';
import { useI18n } from '../../shared/i18n/i18n';

const roomTypeOptions: Array<{ value: Room['type']; label: string }> = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'lab', label: 'Lab' },
  { value: 'office', label: 'Office' },
  { value: 'meeting', label: 'Meeting room' },
];

const schema = z.object({
  name: z.string().min(1, 'Enter a room name'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  type: z.enum(['classroom', 'lab', 'office', 'meeting']),
  isAvailable: z.enum(['true', 'false']),
  description: z.string().optional(),
});

type RoomFormInput = z.input<typeof schema>;
type RoomFormOutput = z.output<typeof schema>;

export function RoomFormModal({
  open,
  room,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  room?: Room | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => Promise<void>;
}) {
  const { t } = useI18n();
  const {
    register,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<RoomFormInput, unknown, RoomFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      capacity: 1,
      type: 'classroom',
      isAvailable: 'true',
      description: '',
    },
  });

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: room?.name ?? '',
      capacity: room?.capacity ?? 1,
      type: room?.type ?? 'classroom',
      isAvailable: String(room?.isAvailable ?? true) as 'true' | 'false',
      description: room?.description ?? '',
    });

    window.setTimeout(() => setFocus('name'), 0);
  }, [open, reset, room, setFocus]);

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={room ? t('rooms.editRoom') : t('rooms.createRoom')}
        description={t('rooms.formDescription')}
      >
        <form
          className="modal-form"
          onSubmit={handleSubmit(async values =>
            onSubmit({
              ...values,
              isAvailable: values.isAvailable === 'true',
            }))}
        >
          <FormSection
            title={t('rooms.formSection.detailsTitle')}
            description={t('rooms.formSection.detailsDescription')}
          >
            <Input
              label={t('rooms.field.name')}
              placeholder={t('rooms.field.namePlaceholder')}
              hint={t('rooms.field.nameHint')}
              error={errors.name?.message}
              fieldClassName="ui-field--primary"
              {...register('name')}
            />
            <div className="detail-grid">
              <Input
                label={t('rooms.capacity')}
                type="number"
                placeholder="20"
                hint={t('rooms.field.capacityHint')}
                error={errors.capacity?.message}
                {...register('capacity')}
              />
              <Select
                label={t('rooms.type')}
                hint={t('rooms.field.typeHint')}
                error={errors.type?.message}
                {...register('type')}
              >
                {roomTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(`roomType.${option.value}`)}
                  </option>
                ))}
              </Select>
              <Select
                label={t('rooms.availability')}
                hint={t('rooms.field.availabilityHint')}
                error={errors.isAvailable?.message}
                {...register('isAvailable')}
              >
                <option value="true">{t('common.available')}</option>
                <option value="false">{t('common.unavailable')}</option>
              </Select>
            </div>
            <Textarea
              label={t('course.field.description')}
              hint={t('rooms.field.descriptionHint')}
              placeholder={t('rooms.field.descriptionPlaceholder')}
              error={errors.description?.message}
              {...register('description')}
            />
          </FormSection>
          <div className="form-actions">
            <span className="subtle">
              {isDirty
                ? t('common.changesReadyToSave')
                : room
                  ? t('rooms.formHint.edit')
                  : t('rooms.formHint.create')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!room && !isDirty)}>
                {loading ? t('common.saving') : room ? t('common.saveChanges') : t('rooms.createRoom')}
              </Button>
              <Button type="button" variant="ghost" onClick={closeGuard.requestClose} disabled={loading}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </form>
      </ModalShell>
      <ConfirmModal
        open={closeGuard.confirmOpen}
        title={t('common.discardChangesTitle')}
        description={t('common.discardChangesDescription')}
        confirmLabel={t('common.discardChangesConfirm')}
        cancelLabel={t('common.keepEditing')}
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
