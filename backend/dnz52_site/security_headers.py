"""
Middleware безпекових заголовків, яких немає у Django за замовчуванням.
"""


class PermissionsPolicyMiddleware:
    """Додає Permissions-Policy — вимикає API-браузера, які сайту не потрібні."""

    POLICY = (
        'camera=(), '
        'microphone=(), '
        'geolocation=(), '
        'usb=(), '
        'interest-cohort=()'
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Permissions-Policy'] = self.POLICY
        return response
