import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePush } from '@/hooks/usePush';

/**
 * Кнопка підписки на push-сповіщення про новини.
 * Не рендериться у браузерах без підтримки.
 */
export function PushSubscribeButton({ className }: { className?: string }) {
  const { status, loading, subscribe, unsubscribe, isSupported } = usePush();

  if (!isSupported || status === 'unsupported') return null;

  if (status === 'subscribed') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        disabled={loading}
        onClick={async () => {
          await unsubscribe();
          toast.success('Ви відписались від сповіщень');
        }}
      >
        <BellRing className="h-4 w-4 text-secondary-600" />
        Сповіщення увімкнено
      </Button>
    );
  }

  if (status === 'denied') {
    return (
      <Button variant="ghost" size="sm" className={className} disabled title="Дозвіл заблоковано в браузері">
        <BellOff className="h-4 w-4" />
        Сповіщення заблоковано
      </Button>
    );
  }

  return (
    <Button
      variant="gradient"
      size="sm"
      className={className}
      disabled={loading}
      onClick={async () => {
        const ok = await subscribe();
        if (ok) toast.success('Готово! Ви отримуватимете сповіщення про новини 🔔');
        else toast.error('Не вдалось увімкнути сповіщення');
      }}
    >
      <Bell className="h-4 w-4" />
      {loading ? 'Підключаємо...' : 'Сповіщати про новини'}
    </Button>
  );
}
