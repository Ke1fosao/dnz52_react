/**
 * Тести компонента OptimizedImage
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

describe('OptimizedImage', () => {
  it('рендерить img з правильним src та alt', () => {
    render(
      <OptimizedImage src="/media/gallery/photo.jpg" alt="Тестове фото" />
    );
    const img = screen.getByRole('img', { name: 'Тестове фото' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/media/gallery/photo.jpg');
    expect(img).toHaveAttribute('alt', 'Тестове фото');
  });

  it('img має атрибут loading="lazy"', () => {
    render(<OptimizedImage src="/media/test.jpg" alt="lazy" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('img має атрибут decoding="async"', () => {
    render(<OptimizedImage src="/media/test.jpg" alt="async" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('рендерить всередині <picture>', () => {
    const { container } = render(
      <OptimizedImage src="/media/test.jpg" alt="picture test" />
    );
    expect(container.querySelector('picture')).toBeInTheDocument();
  });

  it('передає додаткові className', () => {
    render(
      <OptimizedImage
        src="/media/test.jpg"
        alt="class test"
        className="my-custom-class"
      />
    );
    const img = screen.getByRole('img');
    expect(img.className).toContain('my-custom-class');
  });
});
