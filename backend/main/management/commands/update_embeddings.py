import hashlib
from django.core.management.base import BaseCommand
from main.models import SearchEmbedding
from main.ai import get_embedding

class Command(BaseCommand):
    help = 'Генерує/оновлює вектори для розумного пошуку чат-бота'

    def handle(self, *args, **options):
        from main.api_views import _build_search_index
        self.stdout.write('Будуємо контент для індексування...')
        index = _build_search_index()
        self.stdout.write(f'Знайдено {len(index)} елементів.')

        created = 0
        updated = 0
        skipped = 0

        for it in index:
            content_type = it['type']
            object_id = str(it['slug'])
            
            # Текст для векторизації (заголовок + очищений від тегів контент)
            text_to_embed = f"{it['title']}\n{it['excerpt_src']}"
            text_hash = hashlib.md5(text_to_embed.encode('utf-8')).hexdigest()

            obj = SearchEmbedding.objects.filter(content_type=content_type, object_id=object_id).first()
            if obj and obj.text_hash == text_hash:
                skipped += 1
                continue

            self.stdout.write(f'Генерація вектора для: [{content_type}] {it["title"][:40]}...')
            emb = get_embedding(text_to_embed)
            if not emb:
                self.stderr.write(self.style.WARNING(f'Помилка генерації вектора для {object_id}. Пропускаємо.'))
                continue

            if obj:
                obj.text_hash = text_hash
                obj.embedding = emb
                obj.save()
                updated += 1
            else:
                SearchEmbedding.objects.create(
                    content_type=content_type,
                    object_id=object_id,
                    text_hash=text_hash,
                    embedding=emb
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f'Готово! Створено: {created}, Оновлено: {updated}, Пропущено: {skipped}'))
