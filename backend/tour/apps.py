from django.apps import AppConfig


class TourConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tour'

    def ready(self):
        # Автоматично налаштовуємо CORS для Supabase S3 бакета
        # Це потрібно для того, щоб 3D-плеєр Pannellum (WebGL) міг вантажити панорами
        import sys
        if 'runserver' not in sys.argv and 'gunicorn' not in sys.argv and 'wsgi' not in sys.argv:
            return  # Запускаємо тільки на сервері або при dev-сервері

        import threading
        def _setup_cors():
            try:
                from django.conf import settings
                if not getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None):
                    return

                import boto3
                client = boto3.client('s3',
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )
                
                # Дозволяємо GET запити з будь-яких доменів (CORS)
                cors_configuration = {
                    'CORSRules': [{
                        'AllowedHeaders': ['*'],
                        'AllowedMethods': ['GET', 'HEAD'],
                        'AllowedOrigins': ['*'],
                        'ExposeHeaders': []
                    }]
                }
                client.put_bucket_cors(Bucket=settings.AWS_STORAGE_BUCKET_NAME, CORSConfiguration=cors_configuration)
                print("✅ Supabase S3 CORS успішно налаштовано для 3D-турів!")
            except Exception as e:
                print(f"⚠️ Не вдалося автоматично налаштувати CORS для Supabase: {e}")

        # Запускаємо в окремому потоці, щоб не блокувати старт сервера
        threading.Thread(target=_setup_cors, daemon=True).start()

