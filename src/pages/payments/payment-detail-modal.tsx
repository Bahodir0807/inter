import { useState } from 'react';
import { Payment, PaymentStatus } from '../../entities/payment/api';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { Badge } from '../../shared/ui/badges/badge';
import { Button } from '../../shared/ui/buttons/button';
import { Card } from '../../shared/ui/surfaces/card';
import { formatDate, formatMoney } from '../../shared/lib/date';
import { Input } from '../../shared/ui/forms/input';
import { useI18n } from '../../shared/i18n/i18n';

const statusColorMap: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  paid: 'success',
  partial: 'warning',
  debt: 'danger',
  pending: 'warning',
  frozen: 'neutral',
  overpaid: 'info',
};

export function PaymentDetailModal({
  payment,
  onClose,
  onFreeze,
  onUnfreeze,
  canManage = false,
  isFreezing = false,
  isUnfreezing = false,
}: {
  payment: Payment;
  onClose: () => void;
  onFreeze: (reason: string) => void;
  onUnfreeze: () => void;
  canManage?: boolean;
  isFreezing?: boolean;
  isUnfreezing?: boolean;
}) {
  const { t } = useI18n();
  const [freezeReason, setFreezeReason] = useState('');

  return (
    <ModalShell open title={`Payment: ${payment.paymentPeriod}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <Card>
          <div style={{ padding: 16 }}>
            <Badge tone={statusColorMap[payment.status]}>{payment.status}</Badge>
            {payment.isFrozen ? <Badge tone="neutral">frozen</Badge> : null}
          </div>
        </Card>
        <Card>
          <div style={{ padding: 16 }}>
            <div>{t('payments.expectedAmount')}: {formatMoney(payment.expectedAmount)}</div>
            <div>{t('payments.paidAmount')}: {formatMoney(payment.paidAmount)}</div>
            <div>remaining: {formatMoney(payment.remainingAmount)}</div>
            <div>overpaid: {formatMoney(payment.overpaidAmount)}</div>
          </div>
        </Card>
        {payment.paymentHistory.length ? (
          <Card>
            <div style={{ padding: 16 }}>
              {payment.paymentHistory.map((entry, idx) => (
                <div key={`${entry.paidAt}-${idx}`}>
                  {formatMoney(entry.amount)} / {entry.paymentMethod} / {formatDate(entry.paidAt)}
                </div>
              ))}
            </div>
          </Card>
        ) : null}
        {canManage && !payment.isFrozen ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={freezeReason} onChange={event => setFreezeReason(event.target.value)} />
            <Button onClick={() => onFreeze(freezeReason)} disabled={isFreezing || !freezeReason.trim()}>{isFreezing ? t('common.saving') : 'Freeze'}</Button>
          </div>
        ) : canManage ? (
          <Button onClick={onUnfreeze} disabled={isUnfreezing}>{isUnfreezing ? t('common.saving') : 'Unfreeze'}</Button>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
        </div>
      </div>
    </ModalShell>
  );
}
