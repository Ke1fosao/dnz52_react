import { Helmet } from 'react-helmet-async';
import { useContact, useReviews } from '@/hooks/useApi';

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://dnz52.pythonanywhere.com';

/**
 * JSON-LD structured data (Schema.org) для багатих результатів Google:
 * назва закладу, телефон, адреса, режим роботи, рейтинг із відгуків.
 * Рендериться один раз (зазвичай у RootLayout або на головній).
 */
export function StructuredData() {
  const { data: contacts } = useContact();
  const { data: reviewsData } = useReviews({ ordering: '-created_at' });
  const contact = contacts?.[0];

  const reviews = reviewsData?.results || [];
  const ratingCount = reviewsData?.count || reviews.length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'Preschool'],
    name: 'Заклад дошкільної освіти №52',
    alternateName: 'ЗДО №52',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: 'Комунальний заклад дошкільної освіти №52 фізкультурно-оздоровчого напрямку, м. Рівне.',
    foundingDate: '1986',
    areaServed: 'Рівне',
  };

  if (contact) {
    if (contact.address) {
      data.address = {
        '@type': 'PostalAddress',
        streetAddress: contact.address,
        addressLocality: 'Рівне',
        addressCountry: 'UA',
      };
    }
    if (contact.phone) {
      // Беремо перший телефон
      const phone = contact.phone.split(/[,;/]/)[0].trim();
      data.telephone = phone;
    }
    if (contact.email) data.email = contact.email;

    const sameAs = [contact.facebook_url, contact.instagram_url, contact.youtube_url].filter(Boolean);
    if (sameAs.length) data.sameAs = sameAs;
  }

  // Рейтинг із відгуків (показується ⭐ у Google)
  if (avgRating && ratingCount > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: ratingCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
