/**
 * Тести утиліт lib/utils.ts
 */
import { describe, it, expect } from 'vitest';
import { cn, truncate, stripQuotes, plural, stripHtml, mediaUrl, formatDate } from '@/lib/utils';

describe('cn — класи Tailwind', () => {
  it('об\'єднує рядки класів', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('дедуплікує конфліктуючі tailwind-класи', () => {
    // tailwind-merge замінює p-2 на p-4
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('ігнорує falsy-значення', () => {
    expect(cn('foo', false && 'hidden', undefined, null, '')).toBe('foo');
  });
});

describe('truncate — скорочення тексту', () => {
  it('повертає порожній рядок для порожнього вводу', () => {
    expect(truncate('')).toBe('');
  });

  it('не скорочує короткий текст', () => {
    expect(truncate('Короткий текст', 100)).toBe('Короткий текст');
  });

  it('скорочує і додає три крапки', () => {
    const result = truncate('Дуже довгий текст який треба скоротити', 15);
    expect(result).toContain('…');
    expect(result.length).toBeLessThanOrEqual(16); // 15 символів + «…»
  });
});

describe('stripQuotes — прибирання лапок', () => {
  it('прибирає звичайні лапки', () => {
    expect(stripQuotes('"Текст"')).toBe('Текст');
  });

  it('прибирає ялинкові лапки «»', () => {
    expect(stripQuotes('«Текст»')).toBe('Текст');
  });

  it('повертає порожній рядок для null/undefined', () => {
    expect(stripQuotes(null)).toBe('');
    expect(stripQuotes(undefined)).toBe('');
  });

  it('не змінює текст без лапок', () => {
    expect(stripQuotes('Простий текст')).toBe('Простий текст');
  });
});

describe('plural — українські відмінки', () => {
  it('1 → однина (один)', () => {
    expect(plural(1, 'вихователь', 'вихователі', 'вихователів')).toBe('вихователь');
  });

  it('2 → мало (кілька)', () => {
    expect(plural(2, 'вихователь', 'вихователі', 'вихователів')).toBe('вихователі');
  });

  it('11 → багато (виняток для 11)', () => {
    expect(plural(11, 'вихователь', 'вихователі', 'вихователів')).toBe('вихователів');
  });

  it('5 → багато', () => {
    expect(plural(5, 'вихователь', 'вихователі', 'вихователів')).toBe('вихователів');
  });

  it('21 → однина (21 → закінчення як 1)', () => {
    expect(plural(21, 'вихователь', 'вихователі', 'вихователів')).toBe('вихователь');
  });

  it('0 → багато', () => {
    expect(plural(0, 'вихователь', 'вихователі', 'вихователів')).toBe('вихователів');
  });
});

describe('stripHtml — прибирання HTML', () => {
  it('прибирає теги', () => {
    expect(stripHtml('<p>Текст <strong>жирний</strong></p>')).toBe('Текст жирний');
  });

  it('повертає порожній рядок для порожнього вводу', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('mediaUrl — формування URL медіа', () => {
  it('повертає порожній рядок для null', () => {
    expect(mediaUrl(null)).toBe('');
    expect(mediaUrl(undefined)).toBe('');
  });

  it('повертає повний URL без змін', () => {
    const url = 'https://example.com/image.jpg';
    expect(mediaUrl(url)).toBe(url);
  });

  it('додає /media/ префікс до відносного шляху', () => {
    expect(mediaUrl('gallery/photo.jpg')).toBe('/media/gallery/photo.jpg');
  });

  it('не дублює /media/', () => {
    expect(mediaUrl('/media/gallery/photo.jpg')).toBe('/media/gallery/photo.jpg');
  });
});

describe('formatDate — форматування дати', () => {
  it('повертає рядок для валідної дати', () => {
    const result = formatDate('2024-06-01');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('підтримує об\'єкт Date', () => {
    const result = formatDate(new Date(2024, 5, 1));
    expect(typeof result).toBe('string');
  });
});
