import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { useContact } from '@/hooks/useApi';

export function TopBar() {
  const { data } = useContact();
  const contact = data?.[0];

  return (
    <div className="bg-gradient-primary text-white text-xs py-2 hidden md:block">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-5">
          {contact?.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
              <Phone className="h-3.5 w-3.5" />
              <span>{contact.phone}</span>
            </a>
          )}
          {contact?.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
              <Mail className="h-3.5 w-3.5" />
              <span>{contact.email}</span>
            </a>
          )}
          {contact?.address && (
            <span className="flex items-center gap-1.5 opacity-90">
              <MapPin className="h-3.5 w-3.5" />
              <span>{contact.address}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {contact?.facebook_url && (
            <a href={contact.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-secondary transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
          )}
          {contact?.instagram_url && (
            <a href={contact.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-secondary transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {contact?.youtube_url && (
            <a href={contact.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-secondary transition-colors">
              <Youtube className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
