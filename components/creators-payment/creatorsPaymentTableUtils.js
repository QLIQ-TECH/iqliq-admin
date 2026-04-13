/** Shared formatting for creators payment tables */

export const PAYMENT_HEADER_BLUE = '#0084FF';
export const OWED_HEADER_BLUE = '#007bff';

/** Payment table: varied colors */
export const AVATAR_BG = [
  'bg-teal-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
  'bg-cyan-600',
  'bg-rose-500'
];

export function avatarClassForName(name) {
  if (!name || typeof name !== 'string') return AVATAR_BG[0];
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h += name.charCodeAt(i);
  return AVATAR_BG[h % AVATAR_BG.length];
}

export function formatUsDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatCurrency(value) {
  const num = Number(value ?? 0);
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function collaborationContent(row) {
  const g = row?.gigId;
  const desc = g?.description?.trim();
  if (desc) return desc;
  return g?.title ?? '—';
}

export function getDisplayStatus(row) {
  return row?.taskProgress ?? row?.influencerApprovalStatus ?? '—';
}
