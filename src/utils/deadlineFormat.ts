const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** ISO yyyy-mm-dd -> "Jul 15". */
export function formatDeadline(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Short urgency label, e.g. "3 days left" / "Due today" / "Deadline passed". */
export function urgencyLabel(
  urgency?: string | null,
  daysLeft?: number | null,
): string | null {
  if (urgency === 'passed') return 'Deadline passed';
  if (daysLeft == null) return null;
  if (daysLeft <= 0) return 'Due today';
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}
