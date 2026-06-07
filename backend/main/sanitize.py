"""
HTML-санітизація через bleach — захист у глибину для контенту від ШІ та клієнтів.
Дозволяє обмежений набір тегів/атрибутів; решта — вирізається.
"""
import bleach

ALLOWED_TAGS = {
    'p', 'br',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u',
    'a',
    'blockquote',
    'span',
    'img',
    'div',
}

ALLOWED_ATTRS = {
    'a':   ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'class', 'width', 'height'],
    'span': ['class'],
    'div':  ['class'],
    'p':    ['class'],
    'h2':   ['class'],
    'h3':   ['class'],
    'h4':   ['class'],
    'ul':   ['class'],
    'ol':   ['class'],
    'li':   ['class'],
    'blockquote': ['class'],
}


def clean_html(html: str) -> str:
    """Санітизує HTML: залишає безпечні теги, вирізає <script>, event-handlers тощо."""
    if not html:
        return html
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True,        # вирізати заборонені теги (не екранувати)
        strip_comments=True,
    )
