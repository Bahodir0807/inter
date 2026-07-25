import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Course } from '../../entities/course/api';
import { Group } from '../../entities/group/api';
import { Student, StudentFormValues, StudentStatus } from '../../entities/student/api';
import { Button } from '../../shared/ui/buttons/button';
import { CheckboxGroup } from '../../shared/ui/forms/checkbox-group';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { Textarea } from '../../shared/ui/forms/textarea';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';

interface StudentFormModalProps {
  open: boolean;
  student?: Student | null;
  courses: Course[];
  groups: Group[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: StudentFormValues) => Promise<void>;
}

const statusOptions: StudentStatus[] = ['active', 'inactive', 'archived'];

function splitIds(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

export function StudentFormModal({ open, student, courses, groups, loading, onClose, onSubmit }: StudentFormModalProps) {
  const [form, setForm] = useState<StudentFormValues>({
    firstName: '',
    lastName: '',
    groupIds: [],
    courseIds: [],
    branchIds: [],
    status: 'active',
    isActive: true,
  });
  const [branchIdsText, setBranchIdsText] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      phoneNumber: student?.phoneNumber ?? '',
      telegramId: student?.telegramId ?? '',
      parentPhoneNumber: student?.parentPhoneNumber ?? '',
      parentName: student?.parentName ?? '',
      groupIds: student?.groupIds ?? [],
      courseIds: student?.courseIds ?? [],
      branchIds: student?.branchIds ?? [],
      monthlyPayment: student?.monthlyPayment,
      paymentDueDate: student?.paymentDueDate?.slice(0, 10) ?? '',
      comment: student?.comment ?? '',
      status: student?.status ?? 'active',
      isActive: student?.isActive ?? true,
    });
    setBranchIdsText((student?.branchIds ?? []).join(', '));
  }, [open, student]);

  const groupOptions = useMemo(() => groups.map(group => ({
    value: group.id,
    label: group.name,
    description: typeof group.course === 'string' ? group.course : group.course.name,
  })), [groups]);

  const courseOptions = useMemo(() => courses.map(course => ({
    value: course.id,
    label: course.name,
    description: course.price ? String(course.price) : undefined,
  })), [courses]);

  const update = <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => {
    setForm((current: StudentFormValues) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      branchIds: splitIds(branchIdsText),
      isActive: form.status === 'active',
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeDisabled={loading}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      title={student ? 'Edit student' : 'Create student'}
      description="Student profile, enrolment, and payment settings."
    >
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid form-grid--two">
          <Input required label="First name" value={form.firstName} onChange={event => update('firstName', event.target.value)} />
          <Input required label="Last name" value={form.lastName} onChange={event => update('lastName', event.target.value)} />
          <Input label="Phone" value={form.phoneNumber ?? ''} onChange={event => update('phoneNumber', event.target.value)} />
          <Input label="Telegram ID" value={form.telegramId ?? ''} onChange={event => update('telegramId', event.target.value)} />
          <Input label="Parent phone" value={form.parentPhoneNumber ?? ''} onChange={event => update('parentPhoneNumber', event.target.value)} />
          <Input label="Parent name" value={form.parentName ?? ''} onChange={event => update('parentName', event.target.value)} />
          <Input label="Monthly payment" type="number" min={0} value={form.monthlyPayment ?? ''} onChange={event => update('monthlyPayment', event.target.value ? Number(event.target.value) : undefined)} />
          <Input label="Payment due date" type="date" value={form.paymentDueDate ?? ''} onChange={event => update('paymentDueDate', event.target.value)} />
          <Select label="Status" value={form.status ?? 'active'} onChange={event => update('status', event.target.value as StudentStatus)}>
            {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Input label="Branch IDs" value={branchIdsText} onChange={event => setBranchIdsText(event.target.value)} placeholder="ObjectId, ObjectId" />
        </div>
        <CheckboxGroup label="Courses" options={courseOptions} values={form.courseIds ?? []} onChange={values => update('courseIds', values)} />
        <CheckboxGroup label="Groups" options={groupOptions} values={form.groupIds ?? []} onChange={values => update('groupIds', values)} />
        <Textarea label="Comment" value={form.comment ?? ''} onChange={event => update('comment', event.target.value)} rows={4} />
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
