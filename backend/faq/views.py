import re
import time
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.views.decorators.cache import cache_page

from .models import FAQCategory, FAQItem, FAQQuestionSubmission


# Мінімальний інтервал між надсиланнями запитань з однієї сесії (анти-спам)
SUBMISSION_COOLDOWN_SECONDS = 5 * 60   # 5 хвилин


def _is_valid_phone(phone: str) -> bool:
    """Просте сито: має бути ≥7 цифр у будь-якому форматі. Не строгий формат
    бо люди пишуть телефони по-різному — головне щоб можна було передзвонити."""
    if not phone:
        return False
    digits = re.sub(r'\D', '', phone)
    return 7 <= len(digits) <= 15


def faq_page(request):
    """Сторінка FAQ — питання згруповані за категоріями + форма надсилання запитання.
       Кешування знято з цієї view тому що POST-запити треба обробляти живими."""

    submitted = False
    cooldown_blocked = False
    form_errors = []

    # ---- Обробка POST-форми надсилання запитання ----
    if request.method == 'POST':
        # === ЗАХИСТ 1: Honeypot ===
        honeypot = request.POST.get('website', '').strip()
        if honeypot:
            # Бот заповнив приховане поле — мовчки удаємо що все ок
            return _success_redirect(request)

        # === ЗАХИСТ 2: Rate-limit (5 хв між запитаннями з однієї сесії) ===
        last_ts = request.session.get('last_question_ts', 0)
        now_ts = int(time.time())
        if now_ts - last_ts < SUBMISSION_COOLDOWN_SECONDS:
            cooldown_blocked = True
        else:
            # === Валідація полів ===
            name     = request.POST.get('name',     '').strip()[:100]
            phone    = request.POST.get('phone',    '').strip()[:50]
            question = request.POST.get('question', '').strip()[:2000]

            if not name or len(name) < 2:
                form_errors.append("Будь ласка, вкажіть ваше імʼя.")
            if not _is_valid_phone(phone):
                form_errors.append('Вкажіть коректний номер телефону (наприклад: 067 123 45 67).')
            if not question or len(question) < 10:
                form_errors.append('Запитання має бути не коротшим за 10 символів.')

            if not form_errors:
                FAQQuestionSubmission.objects.create(
                    name=name, phone=phone, question=question,
                )
                request.session['last_question_ts'] = now_ts
                request.session.modified = True
                messages.success(
                    request,
                    'Дякуємо! Ваше запитання надіслано. Ми звʼяжемось з вами '
                    'найближчим часом.'
                )
                return redirect(reverse('faq:index') + '#ask-form')

    # ---- Звичайний GET — формуємо контент FAQ ----
    items = FAQItem.objects.filter(is_published=True).select_related('category')

    grouped = []
    for cat in FAQCategory.objects.all():
        cat_items = list(items.filter(category=cat))
        if cat_items:
            grouped.append({'category': cat, 'items': cat_items})

    uncategorized = list(items.filter(category__isnull=True))
    if uncategorized:
        grouped.append({'category': None, 'items': uncategorized})

    return render(request, 'faq/faq_page.html', {
        'grouped':           grouped,
        'total':             items.count(),
        'submitted':         submitted,
        'cooldown_blocked':  cooldown_blocked,
        'cooldown_minutes':  SUBMISSION_COOLDOWN_SECONDS // 60,
        'form_errors':       form_errors,
        # Збережемо введене щоб не пропадало при помилці
        'form_data': {
            'name':     request.POST.get('name', ''),
            'phone':    request.POST.get('phone', ''),
            'question': request.POST.get('question', ''),
        } if request.method == 'POST' else {},
    })


def _success_redirect(request):
    """Допоміжна функція щоб «тихо» завершити запит від бота — повертаємо
    редірект на FAQ. Бот не зрозуміє що його заблокували."""
    return redirect(reverse('faq:index') + '#ask-form')
