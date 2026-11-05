/** Zero-pad to the width of the total, two digits minimum: pad(7, 22) -> "07". */
export const pad = (n: number, total = 0) => String(n).padStart(Math.max(2, String(total).length), '0');

// Dates are local wall-clock strings from EXIF ("2026-01-14T18:22:05"); format them as UTC so nothing shifts.
const toDate = (iso: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayMonthYear = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "Jan 2026" */
export const captionDate = (iso?: string) => (iso ? monthYear.format(toDate(iso)) : '');

/** "14 Jan 2026" (Intl gives "Jan 14, 2026"; reorder to day month year). */
export const fullDate = (iso?: string) => {
  if (!iso) return '';
  const parts = Object.fromEntries(dayMonthYear.formatToParts(toDate(iso)).map((p) => [p.type, p.value]));
  return `${parts.day} ${parts.month} ${parts.year}`;
};

/** "Yosemite Valley, Jan 2026", or whichever half exists. */
export const placeDate = (place: string, iso?: string) => [place, captionDate(iso)].filter(Boolean).join(', ');

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
export const countWord = (n: number) => WORDS[n] ?? String(n);
