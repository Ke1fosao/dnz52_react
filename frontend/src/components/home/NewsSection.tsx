import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useNewsList } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { formatDateShort } from '@/lib/utils';

export function NewsSection() {
  const { data, isLoading } = useNewsList({ page: 1 });
  const items = data?.results.slice(0, 4) || [];

  return (
    <section className="py-20 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
              Останні <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">новини</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium mt-3">Життя нашого садочка у фото та фактах</p>
          </div>
          <Link to="/news" className="group flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all shadow-sm hover:shadow-xl shrink-0">
            Усі новини <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Поки немає новин</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <Link key={item.id} to={`/news/${item.slug}`} className="group">
                <div className="relative h-64 rounded-3xl overflow-hidden mb-5 shadow-md border border-gray-100 dark:border-slate-800">
                  {item.image ? (
                    <OptimizedImage src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                      <Newspaper className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                  {item.category && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-gray-900 dark:text-white shadow-sm uppercase tracking-wide">
                      {item.category.name}
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 bg-gray-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-center font-black leading-tight shadow-lg border border-white/10">
                    {formatDateShort(item.created_at)}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
