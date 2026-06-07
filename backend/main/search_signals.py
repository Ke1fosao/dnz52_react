"""
post_save/post_delete-сигнали для інвалідації кешу пошукового індексу.
Реєструються в MainConfig.ready().
"""
from django.db.models.signals import post_save, post_delete

SEARCH_CACHE_KEY = 'search_index_v1'

# (app_label, model_name) — моделі, чиї зміни роблять індекс застарілим
_INDEXED_MODELS = [
    ('news',       'News'),
    ('main',       'Page'),
    ('groups',     'Group'),
    ('circles',    'Circle'),
    ('specialists','SpecialistPage'),
    ('documents',  'Document'),
    ('events',     'Event'),
    ('faq',        'FAQItem'),
    ('gallery',    'GalleryAlbum'),
]


def _invalidate_search_cache(sender, **kwargs):
    from django.core.cache import cache
    cache.delete(SEARCH_CACHE_KEY)


def register_search_signals():
    """Підключити інвалідацію кешу пошуку до всіх індексованих моделей."""
    import logging
    from django.apps import apps
    log = logging.getLogger('main.search')
    for app_label, model_name in _INDEXED_MODELS:
        try:
            model = apps.get_model(app_label, model_name)
            uid_save   = f'search_invalidate_{app_label}_{model_name}_save'
            uid_delete = f'search_invalidate_{app_label}_{model_name}_delete'
            post_save.connect(_invalidate_search_cache,   sender=model, weak=False, dispatch_uid=uid_save)
            post_delete.connect(_invalidate_search_cache, sender=model, weak=False, dispatch_uid=uid_delete)
        except Exception as exc:
            log.warning('search_signals: не вдалось підключити %s.%s: %s', app_label, model_name, exc)
