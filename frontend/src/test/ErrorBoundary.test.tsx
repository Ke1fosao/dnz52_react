/**
 * Тести компонента ErrorBoundary
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Компонент-заглушка що навмисно кидає помилку
function BrokenComponent(): JSX.Element {
  throw new Error('Тестова помилка рендеру');
}

// Компонент що рендериться нормально
function GoodComponent() {
  return <div>Всі добре</div>;
}

describe('ErrorBoundary', () => {
  // Приглушуємо console.error щоб не засмічувати вивід тестів
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('рендерить дочірні компоненти коли немає помилки', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Всі добре')).toBeInTheDocument();
  });

  it('показує fallback UI при помилці рендеру', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Ой! Щось пішло не так/i)).toBeInTheDocument();
  });

  it('показує кнопку "Перезавантажити" у fallback', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Перезавантажити сторінку/i })).toBeInTheDocument();
  });

  it('показує кнопку "На головну" у fallback', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /На головну/i })).toBeInTheDocument();
  });
});
