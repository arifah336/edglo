import type { Payment, PaymentStatus } from '../types';

export type PaymentDueTone = 'paid' | 'safe' | 'upcoming' | 'today' | 'overdue';

export type PaymentDueState = {
  status: PaymentStatus;
  badgeLabel: string;
  timingLabel: string;
  tone: PaymentDueTone;
  daysUntilDue: number;
};

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getPaymentDueState(payment: Payment, referenceDate: string): PaymentDueState {
  if (payment.status === 'paid') {
    return {
      status: 'paid',
      badgeLabel: 'Lunas',
      timingLabel: 'Pembayaran diterima',
      tone: 'paid',
      daysUntilDue: 0,
    };
  }

  const daysUntilDue = Math.round(
    (parseDateOnly(payment.dueDate) - parseDateOnly(referenceDate)) / 86_400_000,
  );

  if (daysUntilDue < 0) {
    return {
      status: 'overdue',
      badgeLabel: 'Terlambat',
      timingLabel: `Terlambat ${Math.abs(daysUntilDue)} hari`,
      tone: 'overdue',
      daysUntilDue,
    };
  }

  if (daysUntilDue === 0) {
    return {
      status: 'pending',
      badgeLabel: 'Hari Ini',
      timingLabel: 'Jatuh tempo hari ini',
      tone: 'today',
      daysUntilDue,
    };
  }

  if (daysUntilDue <= 3) {
    return {
      status: 'pending',
      badgeLabel: 'Segera',
      timingLabel: `Jatuh tempo ${daysUntilDue} hari lagi`,
      tone: 'upcoming',
      daysUntilDue,
    };
  }

  return {
    status: 'pending',
    badgeLabel: 'Menunggu',
    timingLabel: `${daysUntilDue} hari lagi`,
    tone: 'safe',
    daysUntilDue,
  };
}
