/**
 * JSON-LD компоненти для розширених результатів Google (Rich Results).
 * Кожен хелпер рендерить окремий <script type="application/ld+json"> через Helmet.
 *
 * Використовуються поряд із StructuredData.tsx (EducationalOrganization — базовий)
 * і Seo.tsx — ці компоненти ДОПОВНЮЮТЬ, не замінюють існуючих.
 */
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://dnz52.onrender.com';
const PUBLISHER = {
  '@type': 'EducationalOrganization',
  name: 'Заклад дошкільної освіти №52',
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/favicon.svg`,
  },
};

// ─── NewsArticle ─────────────────────────────────────────────────────────────

interface NewsArticleProps {
  headline: string;
  datePublished: string;
  dateModified?: string;
  image?: string | null;
  slug: string;
}

/**
 * Розширений результат Google: NewsArticle.
 * Розмістіть на сторінці деталей новини (<NewsDetailPage>).
 */
export function NewsArticleLD({ headline, datePublished, dateModified, image, slug }: NewsArticleProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    datePublished,
    dateModified: dateModified || datePublished,
    image: image
      ? [image.startsWith('http') ? image : `${SITE_URL}${image}`]
      : [`${SITE_URL}/favicon.svg`],
    author: PUBLISHER,
    publisher: PUBLISHER,
    url: `${SITE_URL}/news/${slug}`,
    inLanguage: 'uk',
    isPartOf: {
      '@type': 'WebSite',
      name: 'ЗДО №52',
      url: SITE_URL,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

// ─── FAQPage ─────────────────────────────────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQGroup {
  items: FAQItem[];
}

interface FAQPageLDProps {
  groups: FAQGroup[];
}

/**
 * Розширений результат Google: FAQPage.
 * Розмістіть на FAQPage.tsx — mainEntity = усі питання+відповіді.
 * Максимум ~10–20 пар рекомендується Google.
 */
export function FAQPageLD({ groups }: FAQPageLDProps) {
  const allItems = groups.flatMap(g => g.items);
  if (allItems.length === 0) return null;

  // Google рекомендує не більше 20 запитань у FAQPage для Rich Results
  const items = allItems.slice(0, 20);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(it => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        // Прибираємо HTML-теги з відповіді для LD+JSON
        text: it.answer.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 1000),
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

// ─── Event ───────────────────────────────────────────────────────────────────

interface EventLDProps {
  name: string;
  startDate: string;
  endDate?: string | null;
  location?: string;
  description?: string;
  image?: string | null;
  slug: string;
  eventType?: string;
}

/**
 * Розширений результат Google: Event.
 * Розмістіть на EventsPage або сторінці деталей події.
 */
export function EventLD({ name, startDate, endDate, location, description, image, slug: _slug, eventType }: EventLDProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    startDate,
    endDate: endDate || startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location || 'ЗДО №52, м. Рівне',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'вул. Коновальця, 17-б',
        addressLocality: 'Рівне',
        addressCountry: 'UA',
      },
    },
    organizer: PUBLISHER,
    url: `${SITE_URL}/events`,
  };

  if (description) {
    data.description = description.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 500);
  }
  if (image) {
    data.image = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  }
  if (eventType) {
    data.eventType = eventType;
  }
  // Типовий performer — сам заклад
  data.performer = PUBLISHER;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

// ─── BreadcrumbList ───────────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbLDProps {
  /** Список крихт включно з ПОТОЧНОЮ сторінкою (від головної до поточної) */
  crumbs: BreadcrumbItem[];
}

/**
 * Розширений результат Google: BreadcrumbList.
 * Крихти беруться з PageHero (той самий pathname-алгоритм), але також
 * передаються явно щоб мати повний список включно з поточною сторінкою.
 *
 * Використання:
 *   <BreadcrumbLD crumbs={[
 *     { name: 'Головна', url: 'https://dnz52.onrender.com/' },
 *     { name: 'Новини', url: 'https://dnz52.onrender.com/news' },
 *     { name: data.title, url: `https://dnz52.onrender.com/news/${data.slug}` },
 *   ]} />
 */
export function BreadcrumbLD({ crumbs }: BreadcrumbLDProps) {
  if (crumbs.length === 0) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${SITE_URL}${c.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
