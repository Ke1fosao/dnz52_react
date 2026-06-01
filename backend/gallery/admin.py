from django.contrib import admin, messages
from django.utils.html import format_html
from adminsortable2.admin import SortableInlineAdminMixin, SortableAdminBase
from .models import GalleryAlbum, GalleryPhoto, GalleryCategory


class GalleryPhotoInline(SortableInlineAdminMixin, admin.TabularInline):
    """Фото альбому з drag-drop сортуванням (тягни за ⠿ щоб змінити порядок)."""
    model = GalleryPhoto
    extra = 1
    fields = ['image', 'preview', 'title', 'order']
    readonly_fields = ['preview']

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="max-height:64px; border-radius:6px;" />',
                obj.image.url,
            )
        return '—'
    preview.short_description = 'Превʼю'


@admin.register(GalleryCategory)
class GalleryCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_chip', 'icon', 'albums_count', 'order']
    list_editable = ['order']
    prepopulated_fields = {'slug': ('name',)}
    fieldsets = (
        ('Основне', {
            'fields': ('name', 'slug', 'order'),
        }),
        ('Вигляд', {
            'fields': ('icon', 'color'),
            'description': 'Іконка з Bootstrap Icons (https://icons.getbootstrap.com/) '
                            'і колір заголовка секції у галереї.'
        }),
    )

    def color_chip(self, obj):
        return format_html(
            '<span style="display:inline-block; width:20px; height:20px; vertical-align:middle; '
            'border-radius:6px; background:{0}; border:1px solid rgba(0,0,0,0.1);"></span>'
            '<span style="margin-left:8px; font-family:monospace;">{0}</span>',
            obj.color,
        )
    color_chip.short_description = 'Колір'

    def albums_count(self, obj):
        return obj.albums.count()
    albums_count.short_description = 'Альбомів'


@admin.register(GalleryAlbum)
class GalleryAlbumAdmin(SortableAdminBase, admin.ModelAdmin):
    list_display = ['title', 'category_chip', 'photos_count', 'created_at', 'is_published']
    list_filter = ['category', 'is_published', 'created_at']
    list_editable = ['is_published']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [GalleryPhotoInline]
    readonly_fields = ['bulk_upload_button']

    fieldsets = (
        ('Основне', {
            'fields': ('title', 'slug', 'category', 'cover', 'description'),
        }),
        ('Налаштування', {
            'fields': ('is_published',),
        }),
        ('📤 Масове завантаження фото', {
            'fields': ('bulk_upload_button',),
            'description': 'Завантажте багато фото одразу через drag & drop (зручніше за додавання по одному нижче).',
        }),
    )

    @admin.display(description='')
    def bulk_upload_button(self, obj):
        if not obj or not obj.pk:
            return format_html('<span style="color:#aaa;">Спершу збережіть альбом, '
                               'потім зʼявиться кнопка масового завантаження.</span>')
        return format_html(
            '<a class="button" href="{}/bulk-upload/" '
            'style="background:#4A90E2;color:#fff;padding:10px 18px;border-radius:8px;'
            'text-decoration:none;font-weight:600;">📤 Завантажити багато фото</a>',
            obj.pk,
        )

    def category_chip(self, obj):
        if not obj.category:
            return format_html('<span style="color:#aaa;">— Без категорії —</span>')
        return format_html(
            '<span style="display:inline-block; padding:3px 12px; border-radius:12px; '
            'background:{0}22; color:{0}; font-weight:600; font-size:0.78rem;">{1}</span>',
            obj.category.color, obj.category.name,
        )
    category_chip.short_description = 'Категорія'

    def photos_count(self, obj):
        return obj.photos.count()
    photos_count.short_description = 'Фото'

    # ---- Масове завантаження фото (drag & drop + прогрес) ----
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom = [
            path('<int:album_id>/bulk-upload/',
                 self.admin_site.admin_view(self.bulk_upload_view),
                 name='gallery_album_bulk_upload'),
        ]
        return custom + urls

    def bulk_upload_view(self, request, album_id):
        from django.http import HttpResponse, JsonResponse
        from django.shortcuts import get_object_or_404
        album = get_object_or_404(GalleryAlbum, pk=album_id)

        if request.method == 'POST':
            files = request.FILES.getlist('photos')
            start = album.photos.count()
            for i, f in enumerate(files):
                GalleryPhoto.objects.create(album=album, image=f, order=start + i)
            return JsonResponse({'ok': True, 'count': len(files)})

        # GET — сторінка з drag&drop і прогрес-баром
        html = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8">
<title>Масове завантаження — {album.title}</title>
<style>
 body{{font-family:Segoe UI,Roboto,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#1f2937}}
 h1{{font-size:1.4rem}} a{{color:#4A90E2}}
 #drop{{border:3px dashed #4A90E2;border-radius:18px;padding:48px;text-align:center;
   background:#EBF3FC;cursor:pointer;transition:.2s}}
 #drop.over{{background:#D7E7F9;border-color:#2674C9}}
 .bar{{height:14px;background:#e5e7eb;border-radius:8px;overflow:hidden;margin-top:18px;display:none}}
 .bar>div{{height:100%;width:0;background:linear-gradient(90deg,#4A90E2,#50E3C2);transition:width .2s}}
 .btn{{display:inline-block;margin-top:18px;padding:10px 20px;background:#4A90E2;color:#fff;
   border:none;border-radius:10px;font-weight:600;cursor:pointer;text-decoration:none}}
 #log{{margin-top:14px;font-size:.9rem;color:#6b7280}}
</style></head><body>
<h1>📤 Масове завантаження фото</h1>
<p>Альбом: <b>{album.title}</b> · зараз фото: {album.photos.count()}</p>
<div id="drop">
  <div style="font-size:3rem">🖼️</div>
  <p><b>Перетягніть фото сюди</b><br>або клікніть щоб вибрати (можна багато одразу)</p>
</div>
<input id="inp" type="file" accept="image/*" multiple hidden>
<div class="bar"><div id="prog"></div></div>
<div id="log"></div>
<a class="btn" href="../change/">← Повернутись до альбому</a>
<script>
const drop=document.getElementById('drop'),inp=document.getElementById('inp'),
 bar=document.querySelector('.bar'),prog=document.getElementById('prog'),log=document.getElementById('log');
drop.onclick=()=>inp.click();
['dragover','dragenter'].forEach(e=>drop.addEventListener(e,ev=>{{ev.preventDefault();drop.classList.add('over')}}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{{ev.preventDefault();drop.classList.remove('over')}}));
drop.addEventListener('drop',ev=>upload(ev.dataTransfer.files));
inp.onchange=()=>upload(inp.files);
function getCookie(n){{const m=document.cookie.match('(^|;)\\\\s*'+n+'=([^;]+)');return m?m.pop():''}}
function upload(files){{
  if(!files.length)return;
  const fd=new FormData();
  for(const f of files)fd.append('photos',f);
  bar.style.display='block';
  const xhr=new XMLHttpRequest();
  xhr.open('POST','');
  xhr.setRequestHeader('X-CSRFToken',getCookie('csrftoken'));
  xhr.upload.onprogress=e=>{{if(e.lengthComputable)prog.style.width=(e.loaded/e.total*100)+'%'}};
  xhr.onload=()=>{{
    if(xhr.status===200){{const r=JSON.parse(xhr.responseText);
      log.innerHTML='✅ Завантажено '+r.count+' фото! Оновлюю...';
      setTimeout(()=>location.reload(),1200);
    }}else{{log.innerHTML='❌ Помилка завантаження'}}
  }};
  xhr.send(fd);
}}
</script></body></html>'''
        return HttpResponse(html)


@admin.register(GalleryPhoto)
class GalleryPhotoAdmin(admin.ModelAdmin):
    list_display = ['title', 'album', 'preview', 'order']
    list_filter = ['album']
    list_editable = ['order']
    search_fields = ['title', 'album__title']
    # Bulk: вибрати галочками багато фото → дія (видалити / повернути)
    actions = ['rotate_cw', 'rotate_ccw', 'delete_selected']

    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:48px; border-radius:4px;" />',
                obj.image.url,
            )
        return '—'
    preview.short_description = 'Превʼю'

    def _rotate(self, request, queryset, degrees):
        from PIL import Image
        done = failed = 0
        for photo in queryset:
            if not photo.image:
                continue
            try:
                path = photo.image.path
                with Image.open(path) as img:
                    img.rotate(degrees, expand=True).save(path)
                done += 1
            except Exception as e:
                failed += 1
                self.message_user(request, f'{photo}: {e}', level=messages.ERROR)
        if done:
            self.message_user(request, f'Повернуто {done} фото.', level=messages.SUCCESS)

    @admin.action(description='↻ Повернути на 90° (за годинниковою)')
    def rotate_cw(self, request, queryset):
        self._rotate(request, queryset, -90)

    @admin.action(description='↺ Повернути на 90° (проти годинникової)')
    def rotate_ccw(self, request, queryset):
        self._rotate(request, queryset, 90)
