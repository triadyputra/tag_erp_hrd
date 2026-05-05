// src/utils/format.ts

export const formatDate = (value?: string | Date) => {
  if (!value) return '-';

  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatNumber = (value?: number) => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('id-ID');
};

export const formatCurrency = (
  value?: number,
  currency = 'IDR'
) => {
  if (value === null || value === undefined) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value);
};