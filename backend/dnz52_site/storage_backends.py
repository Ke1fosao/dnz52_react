"""
Кастомний S3-бекенд для Supabase Storage.

Supabase Storage (S3-сумісний) повертає HTTP 400 (Bad Request) при виклику
HeadObject на неіснуючий об'єкт у «папці», якої ще не було в бакеті.
Стандартний S3 у такому випадку повертає 404 (Not Found).

django-storages (S3Boto3Storage.exists()) ловить лише 404,
тому Supabase-ова відповідь 400 пробиває exists() → get_available_name()
і валить збереження файлу з ClientError.

Цей клас додає обробку 400 (і 403 на всяк випадок) як «файл не існує».
"""
from botocore.exceptions import ClientError
from storages.backends.s3boto3 import S3Boto3Storage


class SupabaseS3Storage(S3Boto3Storage):
    def exists(self, name):
        try:
            return super().exists(name)
        except ClientError as e:
            code = e.response.get('ResponseMetadata', {}).get('HTTPStatusCode')
            # Supabase повертає 400 замість 404 для неіснуючих шляхів
            if code in (400, 403):
                return False
            raise
