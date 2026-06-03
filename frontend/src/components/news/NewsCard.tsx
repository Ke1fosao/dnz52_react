import { Link } from 'react-router-dom';
import { Eye, ArrowRight, Newspaper } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { formatDateShort } from '@/lib/utils';
import type { NewsListItem } from '@/types';

export function NewsCard({ item }: { item: NewsListItem }) {
  return (
    <Link to={`/news/${item.slug}`} className="group block">
      <div className="relative aspect-[16/11] rounded-3xl overflow-hidden mb-4 shadow-md border border-gray-100 dark:border-slate-800 bg-gray-100 dark:bg-slate-800">
        {item.image ? (
          <OptimizedImage src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
            <Newspaper className="h-16 w-16 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {item.category && (
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-gray-900 dark:text-white shadow-sm uppercase tracking-wide">
            {item.category.name}
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-gray-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-sm font-black shadow-lg border border-white/10">
          {formatDateShort(item.created_at)}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 font-bold mb-2">
        <span className="flex items-center gap-1"><Eye size={14} /> {item.views}</span>
      </div>
      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
        {item.title}
      </h3>
      {item.excerpt && (
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium line-clamp-2 mb-3">{item.excerpt}</p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.tags.slice(0, 3).map(t => (
            <span key={t.id} className="text-[11px] font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">#{t.name}</span>
          ))}
        </div>
      )}
      <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:gap-2.5 transition-all">
        Читати далі <ArrowRight size={16} />
      </span>
    </Link>
  );
}
