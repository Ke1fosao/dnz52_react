import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';
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
  { title: 'Батькам', links: [
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
  const address = contact?.address || 'м. Рівне, вул. Коновальця, 17-б';

  return (
    <footer className="bg-gray-950 text-white pt-28 pb-10 relative overflow-hidden rounded-t-[3rem] md:rounded-t-[4rem] mt-20">
      {/* Світлова пляма */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Гігантський заголовок */}
        <div className="flex flex-col items-center text-center mb-20">
          <Link
            to="/"
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter leading-none mb-6 hover:scale-105 transition-transform duration-500"
          >
            ЗДО №52
          </Link>
          <p className="text-lg md:text-2xl text-gray-400 font-medium max-w-2xl mb-10">
            Чекаємо на вас за адресою {address}
          </p>
          <div className="flex gap-4">
            {contact?.facebook_url && (
              <a href={contact.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all backdrop-blur-md border border-white/10">
                <Facebook size={22} />
              </a>
            )}
            {contact?.instagram_url && (
              <a href={contact.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 hover:scale-110 transition-all backdrop-blur-md border border-white/10">
                <Instagram size={22} />
              </a>
            )}
            {contact?.youtube_url && (
              <a href={contact.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube"
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all backdrop-blur-md border border-white/10">
                <Youtube size={22} />
              </a>
            )}
          </div>
        </div>

        {/* Навігаційні колонки */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-16">
          {FOOTER_LINKS.map(section => (
            <div key={section.title} className="text-center md:text-left">
              <h4 className="font-extrabold text-sm uppercase tracking-widest text-blue-400 mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-gray-400 hover:text-white font-medium transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 border-t border-white/10 pt-8">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-5 text-sm">
          <Link to="/privacy" className="text-gray-400 hover:text-white font-medium transition-colors">Політика конфіденційності</Link>
          <Link to="/terms" className="text-gray-400 hover:text-white font-medium transition-colors">Умови використання</Link>
          <Link to="/accessibility" className="text-gray-400 hover:text-white font-medium transition-colors">Декларація доступності</Link>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 font-medium text-sm gap-3">
          <p>© {year} ЗДО №52, м. Рівне. Усі права захищено.</p>
          <p className="opacity-80">Made by Kovtunovych Dmytro Valeriyovych</p>
        </div>
      </div>
    </footer>
  );
}
