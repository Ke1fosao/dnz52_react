"""
Кастомний S3-бекенд для Supabase Storage.

Вирішує дві проблеми Supabase Storage (S3-сумісний):

1. **InvalidKey на кирилицю** — Supabase НЕ підтримує не-ASCII символи в ключах
   файлів (на відміну від AWS S3). Якщо файл називається «Простора_кімната.jpg»,
   PutObject падає з InvalidKey. Рішення: перейменовуємо файл у UUID-hex ім'я.

2. **400 замість 404 на HeadObject** — Supabase повертає 400 (Bad Request) при
   перевірці існування файлу у «папці», якої ще не було. django-storages ловить
   лише 404, тому 400 пробиває exists(). Рішення: ловимо 400 як «не існує».
"""
import os
import uuid

from botocore.exceptions import ClientError
from storages.backends.s3boto3 import S3Boto3Storage


class SupabaseS3Storage(S3Boto3Storage):

    def get_valid_name(self, name):
        """
        Supabase Storage відкидає ключі з не-ASCII символами (кирилиця тощо).
        Замінюємо будь-яке ім'я файлу на UUID-hex, зберігаючи розширення.
        Шлях (upload_to prefix) лишається без змін — він завжди ASCII.
        """
        dir_name, file_name = os.path.split(name)
        _, ext = os.path.splitext(file_name)
        # Завжди UUID — гарантовано ASCII, унікальний, без колізій
        safe_name = f'{uuid.uuid4().hex}{ext.lower()}'
        return os.path.join(dir_name, safe_name) if dir_name else safe_name

    def exists(self, name):
        """
        Supabase повертає 400 (замість 404) при HeadObject на неіснуючий
        об'єкт у «папці», якої ще не було в бакеті. Ловимо це як «не існує».
        """
        try:
            return super().exists(name)
        except ClientError as e:
            code = e.response.get('ResponseMetadata', {}).get('HTTPStatusCode')
            if code in (400, 403):
                return False
            raise
