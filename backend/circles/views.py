from django.shortcuts import render
from django.views.decorators.cache import cache_page
from .models import Circle, CircleDocument


@cache_page(60 * 15)
def circles_page(request):
    circles   = Circle.objects.filter(is_published=True)
    doc_links = CircleDocument.objects.select_related('document').all()
    return render(request, 'circles/circles_page.html', {
        'circles':   circles,
        'doc_links': doc_links,
    })
