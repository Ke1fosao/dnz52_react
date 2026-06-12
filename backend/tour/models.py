from django.db import models


class TourStop(models.Model):
    """Зупинка віртуального туру — кімната/локація садочка з фото та описом."""
    title = models.CharField('Назва зупинки', max_length=150,
                             help_text='Напр. «Музична зала», «Спортивний майданчик».')
    description = models.TextField('Опис', blank=True,
                                   help_text='Короткий розповідний опис локації.')
    image = models.ImageField('Фото', upload_to='tour/')
    order = models.IntegerField('Порядок', default=0)
    is_published = models.BooleanField('Опубліковано', default=True)

    class Meta:
        verbose_name = 'Зупинка туру'
        verbose_name_plural = 'Віртуальний тур (зупинки)'
        ordering = ['order', 'id']

    def __str__(self):
        return self.title
