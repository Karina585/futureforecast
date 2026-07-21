export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
