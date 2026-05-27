import { useEffect } from 'react';
import { ExternalLink, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';

const ADMIN_URL = 'http://localhost:8000/admin/';

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
        <Card className="border-2 border-primary-200">
          <CardContent className="p-8 text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-gradient-primary text-white flex items-center justify-center mb-5">
              <ShieldCheck className="h-10 w-10" />
            </div>

            <h2 className="font-display text-2xl font-bold mb-2">
              Адмінка живе окремо ✨
            </h2>
            <p className="text-muted-foreground mb-6">
              Цей сайт побудовано на <strong>React</strong> (фронтенд) + <strong>Django</strong> (бекенд+адмінка).
              Адмінпанель — це частина Django і доступна за окремою адресою.
            </p>

            <div className="bg-muted rounded-2xl p-4 mb-6 font-mono text-sm break-all">
              {ADMIN_URL}
            </div>

            <Button asChild variant="gradient" size="lg" className="w-full sm:w-auto">
              <a href={ADMIN_URL} target="_blank" rel="noreferrer">
                <Settings className="h-5 w-5" />
                Відкрити адмінку
                <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
              </a>
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Адмінка відкриється автоматично через 2 секунди...
            </p>

            <div className="mt-8 pt-6 border-t text-left">
              <h3 className="font-bold mb-3">⚠️ Якщо адмінка не відкривається:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
                <li>Переконайтесь що Django backend запущено (вікно з <code className="bg-muted px-1 rounded">manage.py runserver</code>)</li>
                <li>Або запустіть <code className="bg-muted px-1 rounded">start-backend.bat</code> в папці проекту</li>
                <li>Створіть суперюзера якщо ще не створений:
                  <pre className="bg-muted p-3 rounded-xl mt-2 text-xs overflow-x-auto">cd backend
.\.venv\Scripts\python manage.py createsuperuser</pre>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
