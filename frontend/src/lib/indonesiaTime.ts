export const INDONESIA_TIME_ZONE = 'Asia/Jakarta';

export type IndonesiaDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  isoDate: string;
};

const datePartFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: INDONESIA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function dateValue(value: Date | string | number) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+07:00`);
  }

  return value instanceof Date ? value : new Date(value);
}

export function getIndonesiaDateParts(value: Date | string | number = new Date()): IndonesiaDateParts {
  const parts = Object.fromEntries(
    datePartFormatter
      .formatToParts(dateValue(value))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;

  return {
    year,
    month,
    day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

export function getIndonesiaToday() {
  return getIndonesiaDateParts().isoDate;
}

export function formatIndonesiaDate(
  value: Date | string | number = new Date(),
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
) {
  return new Intl.DateTimeFormat('id-ID', {
    ...options,
    timeZone: INDONESIA_TIME_ZONE,
  }).format(dateValue(value));
}

export function formatIndonesiaDateTime(value: Date | string | number = new Date()) {
  const formatted = formatIndonesiaDate(value, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  return `${formatted.replace('.', ':')} WIB`;
}

export function parseDateOnlyUtc(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function formatUtcDateOnly(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}
