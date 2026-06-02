import { useEffect } from 'react';
import { ExternalLink, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';

// На проді Django сервить адмінку з того ж домену → відносний /admin/.
// У деві React живе на :5173 (Django на :8000), тож шлемо на повний URL.
const ADMIN_URL = import.meta.env.DEV ? 'http://localhost:8000/admin/' : '/admin/';

export function AdminRedirectPage() {
  useEffect(() => {
    // Авто-редирект через 2 секунди (щоб юзер встиг прочитати)
    const timer = setTimeout(() => {
      window.open(ADMIN_URL, '_blank', 'noopener,noreferrer');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Seo title="Адмінпанель" />
      <PageHero
        title="Адмінпанель сайту"
        subtitle="Керування контентом через Django адмінку"
        icon="🔧"
        variant="soft"
      />

      <div className="container max-w-2xl py-10">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-slate-800 text-center">
          <div className="h-20 w-20 mx-auto rounded-[1.8rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center mb-5 shadow-lg">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            Адмінка живе окремо ✨
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            Цей сайт побудовано на <strong className="text-gray-700 dark:text-slate-200">React</strong> (фронтенд) + <strong className="text-gray-700 dark:text-slate-200">Django</strong> (бекенд+адмінка).
            Адмінпанель — це частина Django і доступна за окремою адресою.
          </p>

          <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-4 mb-6 font-mono text-sm break-all text-gray-700 dark:text-slate-300">
            {new URL(ADMIN_URL, window.location.origin).href}
          </div>

          <Button asChild variant="gradient" size="lg" className="w-full sm:w-auto">
            <a href={ADMIN_URL} target="_blank" rel="noreferrer">
              <Settings className="h-5 w-5" />
              Відкрити адмінку
              <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
            </a>
          </Button>

          <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
            Адмінка відкриється автоматично через 2 секунди...
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-left">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">⚠️ Якщо адмінка не відкривається:</h3>
            <ol className="space-y-2 text-sm text-gray-500 dark:text-slate-400 list-decimal pl-5">
              <li>Переконайтесь що Django backend запущено (вікно з <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-700 dark:text-slate-300">manage.py runserver</code>)</li>
              <li>Або запустіть <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-700 dark:text-slate-300">start-backend.bat</code> в папці проекту</li>
              <li>Створіть суперюзера якщо ще не створений:
                <pre className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl mt-2 text-xs overflow-x-auto text-gray-700 dark:text-slate-300">cd backend
.\.venv\Scripts\python manage.py createsuperuser</pre>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
