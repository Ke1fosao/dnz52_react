import { Helmet } from 'react-helmet-async';

interface Props {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  /** Канонічний шлях (напр. /news/some-slug). Якщо не задано — поточний URL. */
  path?: string;
  /** Дата публікації для article */
  publishedTime?: string;
}

const SITE_NAME = 'ЗДО №52';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://dnz52.pythonanywhere.com';
const DEFAULT_DESC = 'Заклад дошкільної освіти №52, м. Рівне. Новини, групи, спеціалісти, гуртки, галерея, меню харчування.';

export function Seo({ title, description, image, type = 'website', path, publishedTime }: Props) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Заклад дошкільної освіти, м. Рівне`;
  const desc = description || DEFAULT_DESC;
  const url = path ? `${SITE_URL}${path}` : (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const ogImage = image || `${SITE_URL}/favicon.svg`;

  return (
    <Helmet>
      {/* Базові */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      {/* OpenGraph (Facebook, Viber, Telegram, LinkedIn) */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="uk_UA" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Twitter cards */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
