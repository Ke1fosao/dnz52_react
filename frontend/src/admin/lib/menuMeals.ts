// Спільні константи меню (реюз у формі дня, списку та шаблоні тижня)

export const MEALS = [
  { key: 'breakfast', label: 'Сніданок', emoji: '🥣' },
  { key: 'second_breakfast', label: 'II сніданок', emoji: '🍎' },
  { key: 'lunch', label: 'Обід', emoji: '🍲' },
  { key: 'snack', label: 'Полуденок', emoji: '🥨' },
  { key: 'dinner', label: 'Вечеря', emoji: '🥛' },
] as const;

export type MealKey = (typeof MEALS)[number]['key'];

// Дні тижня в порядку бекенду (Python weekday: 0 = понеділок … 6 = неділя)
export const WEEKDAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];

/** Парсить рядок 'YYYY-MM-DD' у локальну дату (без зсуву через UTC). */
export function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Python-індекс дня тижня (0 = понеділок) для рядка дати. */
export function pyWeekday(iso: string): number {
  return (localDate(iso).getDay() + 6) % 7;
}
