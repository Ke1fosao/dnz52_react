from datetime import date

# Список постійних дитячих свят (місяць, день)
# Назви свят повинні бути такими, щоб ШІ розумів контекст для написання привітання.
KINDERGARTEN_HOLIDAYS = [
    {"month": 9, "day": 1, "name": "День знань (1 Вересня)"},
    {"month": 9, "day": 27, "name": "Всеукраїнський день дошкілля (День вихователя)"},
    {"month": 10, "day": 15, "name": "Свято осені"}, # Приблизна дата, коли зазвичай проводять
    {"month": 12, "day": 6, "name": "День Святого Миколая"},
    {"month": 12, "day": 25, "name": "Різдво"},
    {"month": 1, "day": 1, "name": "Новий Рік"},
    {"month": 3, "day": 8, "name": "Свято весни та мами"},
    {"month": 5, "day": 12, "name": "День матері"}, # Зазвичай друга неділя травня, але для простоти беремо орієнтовну
    {"month": 6, "day": 1, "name": "Міжнародний день захисту дітей"},
    
    # ТЕСТОВЕ СВЯТО (щоб перевірити роботу) - через 2 дні від поточної дати
    {"month": 6, "day": 12, "name": "ТЕСТОВЕ СВЯТО: День Тестувальника"},
]

def get_upcoming_holiday(days_ahead=7):
    """
    Повертає найближче свято, якщо воно настане протягом `days_ahead` днів.
    Інакше повертає None.
    """
    today = date.today()
    
    for holiday in KINDERGARTEN_HOLIDAYS:
        try:
            # Спробуємо створити дату свята в поточному році
            holiday_date = date(today.year, holiday['month'], holiday['day'])
        except ValueError:
            continue # Якщо дата некоректна (напр. 29 лютого не у високосний рік)

        # Якщо свято вже пройшло в цьому році, дивимось на наступний рік
        if holiday_date < today:
            try:
                holiday_date = date(today.year + 1, holiday['month'], holiday['day'])
            except ValueError:
                continue

        days_until = (holiday_date - today).days

        # Якщо свято в межах вікна підказок (наприклад, від 0 до 7 днів)
        if 0 <= days_until <= days_ahead:
            return {
                "name": holiday["name"],
                "date": holiday_date.isoformat(),
                "days_until": days_until
            }
            
    return None
