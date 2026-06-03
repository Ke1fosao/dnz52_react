from django.apps import AppConfig


class EventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'events'
    verbose_name = 'Календар подій'

    def ready(self):
        # Підключаємо signal для web-push сповіщень про події
        from . import signals  # noqa: F401
