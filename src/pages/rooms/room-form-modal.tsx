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
        title={room ? 'Edit room' : 'Create room'}
        description="Keep classroom operations accurate by updating the room profile, capacity, and availability in one place."
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
            title="Room details"
            description="Use the same naming and type conventions your team already relies on in schedules and operations."
          >
            <Input
              label="Room name"
              placeholder="For example: Room 204"
              hint="Shown in schedules, filters, and room references."
              error={errors.name?.message}
              fieldClassName="ui-field--primary"
              {...register('name')}
            />
            <div className="detail-grid">
              <Input
                label="Capacity"
                type="number"
                placeholder="20"
                hint="Used to assess whether the room fits the group size."
                error={errors.capacity?.message}
                {...register('capacity')}
              />
              <Select
                label="Type"
                hint="Helps operators quickly distinguish learning and non-learning spaces."
                error={errors.type?.message}
                {...register('type')}
              >
                {roomTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Availability"
                hint="Unavailable rooms stay visible but are clearly marked for operators."
                error={errors.isAvailable?.message}
                {...register('isAvailable')}
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </Select>
            </div>
            <Textarea
              label="Description"
              hint="Add a practical note only if it helps the team make scheduling decisions faster."
              placeholder="For example: projector installed, second floor, quieter space for exams"
              error={errors.description?.message}
              {...register('description')}
            />
          </FormSection>
          <div className="form-actions">
            <span className="subtle">
              {isDirty
                ? 'Changes are ready to save.'
                : room
                  ? 'Update availability, capacity, or notes only where needed.'
                  : 'Start with the room identity, then confirm type and availability.'}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!room && !isDirty)}>
                {loading ? 'Saving...' : room ? 'Save changes' : 'Create room'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeGuard.requestClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </ModalShell>
      <ConfirmModal
        open={closeGuard.confirmOpen}
        title="Discard changes?"
        description="You have unsaved changes in this form. Discard them and close the modal?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
