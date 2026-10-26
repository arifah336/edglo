export function formatTime12Hour(value: string) {
  const [rawHours, rawMinutes = '00'] = value.replace('.', ':').split(':');
  const hours = Number(rawHours);
  const minutes = rawMinutes.padStart(2, '0').slice(0, 2);
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(2, '0')}.${minutes} ${period}`;
}

export function formatTimeLabel(value: string) {
  const [rawHours = '00', rawMinutes = '00'] = value.replace('.', ':').split(':');
  const time24 = `${rawHours.padStart(2, '0')}.${rawMinutes.padStart(2, '0').slice(0, 2)}`;

  return `${time24} WIB (${formatTime12Hour(value)})`;
}
