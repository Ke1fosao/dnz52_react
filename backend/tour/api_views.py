import urllib.request
from django.http import StreamingHttpResponse, HttpResponseBadRequest
from rest_framework import viewsets

from .models import TourStop
from .serializers import TourStopSerializer


class TourStopViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/tour/ — опубліковані зупинки віртуального туру (впорядковані)."""
    queryset = TourStop.objects.filter(is_published=True)
    serializer_class = TourStopSerializer
    pagination_class = None

def tour_image_proxy(request):
    """Proxy image to bypass Pannellum CORS issues on Supabase."""
    url = request.GET.get('url')
    if not url or 'supabase.co' not in url:
        return HttpResponseBadRequest("Invalid URL")
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=10)
        
        def file_iterator():
            while True:
                chunk = resp.read(8192)
                if not chunk:
                    break
                yield chunk
                
        response = StreamingHttpResponse(
            file_iterator(),
            content_type=resp.headers.get('Content-Type', 'image/jpeg')
        )
        response['Cache-Control'] = 'public, max-age=86400'
        response['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        return HttpResponseBadRequest(str(e))
