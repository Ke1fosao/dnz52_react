import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { GalleryAlbumListItem } from '@/types';

export function AlbumCard({ album }: { album: GalleryAlbumListItem }) {
  return (
    <Card className="group overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all">
      <Link to={`/gallery/album/${album.slug}`}>
        <div className="aspect-[4/3] overflow-hidden relative bg-muted">
          <img
            src={album.cover}
            alt={album.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <Badge className="absolute top-3 right-3 backdrop-blur bg-black/40 text-white border-0">
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            {album.photos_count} фото
          </Badge>
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-display font-bold text-xl mb-1 drop-shadow-md">
              {album.title}
            </h3>
            <div className="text-xs opacity-90">{formatDate(album.created_at)}</div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
