"""
pre_save-сигнали для авто-ресайзу зображень при завантаженні.
Підключаються до всіх моделей з ImageField через register_image_signals()
(викликається в MainConfig.ready()).
"""
from django.db.models.signals import pre_save

# (app_label, model_name, field_name)
_IMAGE_FIELDS = [
    ('main', 'Page',                     'image'),
    ('main', 'PageImage',                'image'),
    ('main', 'Slider',                   'image'),
    ('main', 'ParentsAnnouncement',      'image'),
    ('main', 'ParentsAdaptationPhoto',   'image'),
    ('main', 'ParentsApplicationSample', 'image'),
    ('main', 'StaffMember',              'photo'),
    ('gallery', 'GalleryAlbum',          'cover'),
    ('gallery', 'GalleryPhoto',          'image'),
    ('news', 'News',                     'image'),
    ('groups', 'Group',                  'cover'),
    ('groups', 'GroupStaff',             'photo'),
    ('circles', 'Circle',                'cover'),
    ('specialists', 'Specialist',        'photo'),
    ('specialists', 'SpecialistPagePhoto', 'image'),
    ('events', 'Event',                  'image'),
]


def _make_resize_handler(field_name):
    def _handler(sender, instance, **kwargs):
        from .imaging import downscale_image
        downscale_image(instance, field_name)
    return _handler


def register_image_signals():
    """Підключити pre_save-ресайз до всіх моделей із зображеннями."""
    import logging
    from django.apps import apps
    log = logging.getLogger('main.imaging')
    for app_label, model_name, field_name in _IMAGE_FIELDS:
        try:
            model = apps.get_model(app_label, model_name)
            pre_save.connect(
                _make_resize_handler(field_name),
                sender=model,
                weak=False,
                dispatch_uid=f'imaging_{app_label}_{model_name}_{field_name}',
            )
        except Exception as exc:
            log.warning('imaging: не вдалось підключити %s.%s: %s', app_label, model_name, exc)
