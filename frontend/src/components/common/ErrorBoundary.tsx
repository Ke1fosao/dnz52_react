import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Відправляємо помилку до Sentry (якщо VITE_SENTRY_DSN задано)
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            Ой! Щось пішло не так
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-6 leading-relaxed">
            На сторінці виникла несподівана помилка. Спробуйте перезавантажити
            або поверніться на головну.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-full shadow-md hover:-translate-y-0.5 transition-transform"
            >
              Перезавантажити сторінку
            </button>
            <button
              onClick={this.handleHome}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold py-3 px-6 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              На головну
            </button>
          </div>
        </div>
      </div>
    );
  }
}
