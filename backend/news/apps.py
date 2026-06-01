from django.apps import AppConfig


class NewsConfig(AppConfig):
    name = 'news'

    def ready(self):
        # Підключаємо signal для web-push сповіщень
        from . import signals  # noqa: F401
