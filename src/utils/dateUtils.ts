// NEVER use date.toISOString().split('T')[0] for calendar dates — gives UTC date
// NEVER use new Date("2026-02-14") — parses as UTC midnight
// Use these instead:

export function getLocalDateString(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
