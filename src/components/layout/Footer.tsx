import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Clock } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useContact } from '@/hooks/useApi';

const FOOTER_LINKS = [
  { title: 'Заклад', links: [
    { to: '/about', label: 'Про заклад' },
    { to: '/staff', label: 'Керівництво' },
    { to: '/attestation', label: 'Атестація' },
    { to: '/contacts', label: 'Контакти' },
  ]},
  { title: 'Дітям', links: [
    { to: '/groups', label: 'Групи' },
    { to: '/circles', label: 'Гуртки' },
    { to: '/menu', label: 'Меню' },
    { to: '/gallery', label: 'Галерея' },
  ]},
  { title: 'Для батьків', links: [
    { to: '/parents', label: 'Батькам' },
    { to: '/news', label: 'Новини' },
    { to: '/documents', label: 'Документи' },
    { to: '/reviews', label: 'Відгуки' },
  ]},
];

export function Footer() {
  const { data } = useContact();
  const contact = data?.[0];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-primary-700 to-primary-900 text-white mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="md" showText={false} className="text-white" />
              <div>
                <div className="font-display font-bold text-2xl">ЗДО №52</div>
                <div className="text-sm text-white/80">Заклад дошкільної освіти</div>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed mb-4 max-w-md">
              Турбота, розвиток і щастя кожної дитини — наша головна цінність.
              Працюємо для того, щоб ваші малюки росли в любові й безпеці.
            </p>
            <div className="flex gap-3">
              {contact?.facebook_url && (
                <a href={contact.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-secondary hover:text-secondary-foreground flex items-center justify-center transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {contact?.instagram_url && (
                <a href={contact.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-secondary hover:text-secondary-foreground flex items-center justify-center transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {contact?.youtube_url && (
                <a href={contact.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-secondary hover:text-secondary-foreground flex items-center justify-center transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {FOOTER_LINKS.map(section => (
            <div key={section.title}>
              <h4 className="font-display font-bold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-white/80 hover:text-secondary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {contact && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
            {contact.address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <span className="text-white/90">{contact.address}</span>
              </div>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-start gap-3 text-sm hover:text-secondary transition-colors">
                <Phone className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-start gap-3 text-sm hover:text-secondary transition-colors">
                <Mail className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <span>{contact.email}</span>
              </a>
            )}
            {contact.working_hours && (
              <div className="flex items-start gap-3 text-sm md:col-span-3">
                <Clock className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <span className="text-white/90 whitespace-pre-line">{contact.working_hours}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        <div className="container py-4 text-xs text-white/60 text-center">
          © {year} Заклад дошкільної освіти №52, м. Рівне. Усі права захищено.
        </div>
      </div>
    </footer>
  );
}
