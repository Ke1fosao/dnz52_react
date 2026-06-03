"""RSS-стрічка новин — /rss/.

Дозволяє підписатися на новини закладу у будь-якому RSS-читачі.
"""
from django.contrib.syndication.views import Feed
from django.utils.html import strip_tags

from .api_views import live_news_qs


class LatestNewsFeed(Feed):
    title = 'ЗДО №52 — Новини'
    link = '/news/'
    description = 'Останні новини, оголошення та події ЗДО №52, м. Рівне.'

    def items(self):
        return live_news_qs().order_by('-created_at')[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        text = strip_tags(item.content or '')
        return text[:300] + ('…' if len(text) > 300 else '')

    def item_link(self, item):
        return f'/news/{item.slug}'

    def item_pubdate(self, item):
        return item.created_at

    def item_categories(self, item):
        return [item.category.name] if item.category else []
