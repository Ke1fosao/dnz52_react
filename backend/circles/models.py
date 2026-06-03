from django.db import models
from markdownx.models import MarkdownxField
from gallery.models import GalleryAlbum
from documents.models import Document


class Circle(models.Model):
    name        = models.CharField('Назва гуртка', max_length=200)
    slug        = models.SlugField('URL', unique=True)
    tagline     = models.CharField(
        'Короткий слоган', max_length=300, blank=True,
        help_text='Одне речення для картки, напр. «Перші слова англійською через гру».',
    )
    leader      = models.CharField('Керівник гуртка', max_length=200)
    age_group   = models.CharField('Вікова група', max_length=100, blank=True)
    schedule    = models.CharField('Розклад (коротко)', max_length=200, blank=True)
    duration    = models.CharField('Тривалість заняття', max_length=100, blank=True, help_text='напр. «25–35 хв»')
    format      = models.CharField('Формат', max_length=120, blank=True, help_text='напр. «Групові заняття, до 10 дітей»')
    price       = models.CharField('Вартість', max_length=120, blank=True, default='Безкоштовно')
    icon        = models.CharField('Іконка (Bootstrap Icons)', max_length=50, default='bi-star')
    color       = models.CharField('Колір (HEX)', max_length=7, default='#4A90E2')
    cover       = models.ImageField('Обкладинка (необовʼязково)', upload_to='circles/', blank=True)
    goal        = MarkdownxField('Мета та завдання')
    description = MarkdownxField('Опис діяльності')
    album       = models.ForeignKey(GalleryAlbum, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Фотоальбом')
    is_featured = models.BooleanField('Рекомендований (виділити)', default=False)
    order       = models.IntegerField('Порядок', default=0)
    is_published = models.BooleanField('Опубліковано', default=True)

    class Meta:
        verbose_name = 'Гурток'
        verbose_name_plural = 'Гуртки'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class CircleBenefit(models.Model):
    """Пункт «Що розвиває» — для сітки переваг на сторінці гуртка."""
    circle = models.ForeignKey(Circle, on_delete=models.CASCADE, related_name='benefits', verbose_name='Гурток')
    icon   = models.CharField('Іконка (Bootstrap Icons)', max_length=50, default='bi-check-circle')
    title  = models.CharField('Що розвиває', max_length=150)
    text   = models.CharField('Пояснення', max_length=300, blank=True)
    order  = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Перевага гуртка'
        verbose_name_plural = 'Що розвиває (переваги)'
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.circle.name} — {self.title}'


class CircleSession(models.Model):
    """Рядок розкладу занять гуртка (для таблиці розкладу)."""
    circle = models.ForeignKey(Circle, on_delete=models.CASCADE, related_name='sessions', verbose_name='Гурток')
    day    = models.CharField('День', max_length=40)
    time   = models.CharField('Час', max_length=40)
    note   = models.CharField('Група / примітка', max_length=120, blank=True)
    order  = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Заняття у розкладі'
        verbose_name_plural = 'Розклад занять'
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.circle.name}: {self.day} {self.time}'


class CircleDocument(models.Model):
    title    = models.CharField('Назва', max_length=200)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, verbose_name='Документ')
    order    = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Документ гурткової роботи'
        verbose_name_plural = 'Документи гурткової роботи'
        ordering = ['order', 'id']

    def __str__(self):
        return self.title
