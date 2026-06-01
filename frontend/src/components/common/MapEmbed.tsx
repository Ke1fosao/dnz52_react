import { MapPin, ExternalLink } from 'lucide-react';

interface Props {
  embed: string;
  address?: string;
  className?: string;
}

/**
 * Очищає адресу для геокодування Google Maps:
 *  - прибирає індекс (5 цифр), скорочення "м.", "вул.", дужки
 *  - замінює коми і крапки з комами на пробіли
 *  - додає ", Україна" якщо немає
 */
function cleanAddress(raw: string): string {
  return raw
    .replace(/\b\d{5}\b/g, '')              // індекс
    .replace(/\bм\.\s*/gi, '')              // "м." → ""
    .replace(/\bвул\.\s*/gi, '')            // "вул." → ""
    .replace(/\bпров\.\s*/gi, '')           // "пров." → ""
    .replace(/\bпр\.\s*/gi, '')             // "пр." → ""
    .replace(/[,;]/g, ' ')                  // коми/крапки з комами
    .replace(/\s+/g, ' ')                   // зайві пробіли
    .trim();
}

function withCountry(addr: string): string {
  return /україн|ukraine/i.test(addr) ? addr : `${addr}, Україна`;
}

function buildEmbedUrl(query: string): string {
  const cleaned = withCountry(cleanAddress(query));
  // Параметри:
  //   q=...   — пошуковий запит
  //   hl=uk   — українська мова
  //   z=16    — рівень зуму
  //   t=m     — звичайна мапа (не супутник)
  //   iwloc=B — без infowindow з адресою
  //   ie=UTF8 — нормальне читання Unicode
  const params = new URLSearchParams({
    q: cleaned,
    hl: 'uk',
    z: '16',
    t: 'm',
    ie: 'UTF8',
    iwloc: 'B',
    output: 'embed',
  });
  return `https://www.google.com/maps?${params.toString()}`;
}

/**
 * Розумне вбудовування карти.
 * Підтримує:
 *   1. Готовий <iframe>...</iframe> код з Google Maps "Поділитися → Вбудувати"
 *   2. URL Google Maps → пробуємо витягти координати, інакше передаємо як query
 *   3. Просту адресу → автоматично очищаємо й шукаємо
 */
export function MapEmbed({ embed, address, className = '' }: Props) {
  const trimmed = (embed || '').trim();

  // 1. Готовий iframe код — рендеримо як є
  if (trimmed.toLowerCase().startsWith('<iframe')) {
    return (
      <div
        className={`w-full h-full overflow-hidden [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 ${className}`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  // Визначаємо source для iframe
  let embedSrc: string | null = null;
  let openMapsUrl: string;

  if (trimmed.match(/^https?:\/\//)) {
    // URL — пробуємо витягти координати з @lat,lng у Google Maps URL
    const coords = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coords) {
      const [, lat, lng] = coords;
      const params = new URLSearchParams({
        q: `${lat},${lng}`,
        hl: 'uk', z: '16', t: 'm', ie: 'UTF8', iwloc: 'B', output: 'embed',
      });
      embedSrc = `https://www.google.com/maps?${params.toString()}`;
      openMapsUrl = trimmed;
    } else {
      embedSrc = buildEmbedUrl(trimmed);
      openMapsUrl = trimmed;
    }
  } else if (trimmed) {
    embedSrc = buildEmbedUrl(trimmed);
    openMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(cleanAddress(trimmed))}`;
  } else if (address) {
    embedSrc = buildEmbedUrl(address);
    openMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(cleanAddress(address))}`;
  } else {
    openMapsUrl = 'https://www.google.com/maps/search/Рівне';
  }

  if (embedSrc) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <iframe
          src={embedSrc}
          title="Розташування на карті"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full border-0"
        />
        {/* Кнопка "Відкрити в Google Maps" поверх карти */}
        <a
          href={openMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-foreground px-3 py-2 rounded-full shadow-soft text-xs font-semibold backdrop-blur transition-all hover:scale-105"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Відкрити в Google Maps
        </a>
      </div>
    );
  }

  // Fallback — посилання
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-soft p-8 text-center ${className}`}>
      <MapPin className="h-12 w-12 text-primary mb-3" />
      <p className="text-muted-foreground mb-4">Адреса не вказана</p>
      <a
        href={openMapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
      >
        Знайти на Google Maps <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
