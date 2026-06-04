import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opts,
  }).format(d);
}

export function formatDateShort(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function truncate(text: string, max = 160) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

/** Прибирає обрамляючі лапки/«ялинки» (у даних вони непослідовні), щоб обернути одноманітно. */
export function stripQuotes(s: string | null | undefined): string {
  return (s || '').replace(/^[\s«»"„“”]+|[\s«»"„“”]+$/g, '');
}

/** Українські відмінкові форми за числом: plural(2, 'вихователь', 'вихователі', 'вихователів'). */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/media')) return path;
  return `/media/${path.replace(/^\/+/, '')}`;
}
