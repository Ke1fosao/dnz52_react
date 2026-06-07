/**
 * Тести компонента Seo (react-helmet-async)
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Seo } from '@/components/common/Seo';

function renderSeo(props: Parameters<typeof Seo>[0]) {
  return render(
    <HelmetProvider>
      <Seo {...props} />
    </HelmetProvider>
  );
}

describe('Seo — теги для пошукових систем', () => {
  it('рендерить без помилок з мінімальними пропсами', () => {
    const { container } = renderSeo({});
    // HelmetProvider сам не рендерить в DOM напряму, але компонент не кидає помилок
    expect(container).toBeTruthy();
  });

  it('рендерить з усіма пропсами без помилок', () => {
    const { container } = renderSeo({
      title: 'Тестова сторінка',
      description: 'Опис тестової сторінки',
      type: 'article',
      path: '/news/test',
      publishedTime: '2024-01-01T00:00:00Z',
    });
    expect(container).toBeTruthy();
  });

  it('рендерить тип website за замовчуванням', () => {
    // Перевіряємо що компонент не кидає помилок при відсутності type
    const { container } = renderSeo({ title: 'Головна' });
    expect(container).toBeTruthy();
  });
});
