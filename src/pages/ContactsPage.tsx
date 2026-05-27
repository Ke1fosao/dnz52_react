import { ReactNode } from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { MapEmbed } from '@/components/common/MapEmbed';
import { Card, CardContent } from '@/components/ui/card';
import { useContact } from '@/hooks/useApi';

// ============================================================================
// Парсимо телефони і графік
// ============================================================================

/** Розбиває "64-82-55, 64-83-98" або "64-82-55 / 64-83-98" на масив */
function parsePhones(raw: string): string[] {
  return raw
    .split(/[,;/]|\sі\s/i)
    .map(s => s.trim())
    .filter(Boolean);
}

/** Прибирає все що не цифра / + для tel: посилання */
function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

interface ScheduleRow {
  days: string;
  time: string;
}

/**
 * Розбиває "Пн–Пт: 7:00–19:00\nСб–Нд: вихідний" на масив { days, time }.
 * Підтримує : або — як розділювач, або просто одну колонку.
 */
function parseSchedule(raw: string): ScheduleRow[] {
  return raw
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^(.+?)\s*[:—–-]\s*(.+)$/);
      if (m) {
        return { days: m[1].trim(), time: m[2].trim() };
      }
      return { days: '', time: line };
    });
}

// ============================================================================
// Page
// ============================================================================

export function ContactsPage() {
  const { data, isLoading } = useContact();
  const contact = data?.[0];

  return (
    <>
      <Seo title="Контакти" description="Як з нами зв'язатися" />
      <PageHero
        title="Контакти"
        subtitle="Ми завжди раді спілкуванню з вами"
        icon="📞"
        variant="sky"
      />

      <div className="container py-10 max-w-6xl">
        {isLoading ? (
          <Spinner />
        ) : !contact ? (
          <p className="text-center text-muted-foreground py-12">Контактна інформація поки не додана.</p>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Ліва колонка — контактна інформація */}
            <div className="lg:col-span-2 space-y-4">
              {/* Адреса */}
              <ContactCard icon={<MapPin />} label="Адреса">
                <div className="font-display font-bold text-base">{contact.address}</div>
              </ContactCard>

              {/* Телефони (можуть бути множинні) */}
              {contact.phone && (
                <ContactCard icon={<Phone />} label="Телефони">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parsePhones(contact.phone).map((p, i) => (
                      <a
                        key={`${p}-${i}`}
                        href={telHref(p)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary-50 text-primary-700 font-display font-bold hover:bg-primary hover:text-white transition-colors shadow-soft hover:shadow-soft-lg"
                      >
                        <Phone className="h-4 w-4" />
                        {p}
                      </a>
                    ))}
                  </div>
                </ContactCard>
              )}

              {/* Email */}
              {contact.email && (
                <ContactCard icon={<Mail />} label="Електронна пошта">
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1.5 font-display font-bold text-primary-700 hover:underline break-all"
                  >
                    {contact.email}
                  </a>
                </ContactCard>
              )}

              {/* Режим роботи */}
              {contact.working_hours && (
                <ContactCard icon={<Clock />} label="Режим роботи">
                  <div className="mt-1 divide-y divide-border/60">
                    {parseSchedule(contact.working_hours).map((row, i) => (
                      <div
                        key={i}
                        className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                      >
                        {row.days ? (
                          <>
                            <span className="font-display font-bold text-sm">{row.days}</span>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              /вихідн|закри/i.test(row.time)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {row.time}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm">{row.time}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ContactCard>
              )}

              {/* Соціальні мережі */}
              {(contact.facebook_url || contact.instagram_url || contact.youtube_url) && (
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                      Ми у соціальних мережах
                    </p>
                    <div className="flex gap-3">
                      {contact.facebook_url && (
                        <a href={contact.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"
                          className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all hover:scale-110">
                          <Facebook className="h-6 w-6" />
                        </a>
                      )}
                      {contact.instagram_url && (
                        <a href={contact.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"
                          className="h-12 w-12 rounded-2xl bg-pink-100 text-pink-700 hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-600 hover:text-white flex items-center justify-center transition-all hover:scale-110">
                          <Instagram className="h-6 w-6" />
                        </a>
                      )}
                      {contact.youtube_url && (
                        <a href={contact.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube"
                          className="h-12 w-12 rounded-2xl bg-red-100 text-red-700 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all hover:scale-110">
                          <Youtube className="h-6 w-6" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Права колонка — карта */}
            <Card className="overflow-hidden lg:col-span-3 self-start">
              <div className="aspect-square lg:aspect-auto lg:h-full lg:min-h-[600px] w-full">
                <MapEmbed embed={contact.map_embed} address={contact.address} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// ContactCard — універсальна картка з іконкою + контентом
// ============================================================================

function ContactCard({
  icon, label, children,
}: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shrink-0 shadow-soft">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">{label}</div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
