export function formatDate(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatMoney(value?: number | null) {
  if (typeof value !== 'number') {
    return '-';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(value);
}
