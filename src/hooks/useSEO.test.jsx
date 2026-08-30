import { renderHook } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useSEO } from './useSEO';

const BASE = {
  title: 'Test Product | Pehenavas',
  description: 'A test product description.',
  image: 'https://example.com/img.jpg',
  url: 'https://example.com/product/1',
  jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: 'Test Product' },
};

afterEach(() => {
  document.title = 'Pehenavas - The Royal Heritage';
  document.head.innerHTML = '';
});

describe('useSEO', () => {
  it('sets title, meta description, OG/Twitter tags, canonical and JSON-LD', () => {
    renderHook(() => useSEO(BASE));

    expect(document.title).toBe(BASE.title);
    expect(document.querySelector('meta[name="description"]').content).toBe(BASE.description);
    expect(document.querySelector('meta[property="og:title"]').content).toBe(BASE.title);
    expect(document.querySelector('meta[property="og:description"]').content).toBe(BASE.description);
    expect(document.querySelector('meta[property="og:image"]').content).toBe(BASE.image);
    expect(document.querySelector('meta[property="og:url"]').content).toBe(BASE.url);
    expect(document.querySelector('meta[property="og:type"]').content).toBe('website');
    expect(document.querySelector('meta[name="twitter:card"]').content).toBe('summary_large_image');
    expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(BASE.url);

    const ld = document.getElementById('seo-jsonld');
    expect(ld).not.toBeNull();
    expect(JSON.parse(ld.textContent)).toEqual(BASE.jsonLd);
  });

  it('strips empty optional values instead of emitting blank tags', () => {
    renderHook(() => useSEO({ title: 'No Meta', description: '', image: '' }));

    expect(document.querySelector('meta[name="description"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.title).toBe('No Meta');
  });

  it('falls back to the current URL when none is provided', () => {
    renderHook(() => useSEO({ title: 'Home' }));

    expect(document.querySelector('meta[property="og:url"]').content).toBe(window.location.href);
  });

  it('updates in place instead of duplicating tags on new props', () => {
    const { rerender } = renderHook((props) => useSEO(props), { initialProps: BASE });
    rerender({ ...BASE, title: 'Updated Title', description: 'Updated description.' });

    expect(document.title).toBe('Updated Title');
    expect(document.querySelectorAll('meta[property="og:title"]').length).toBe(1);
    expect(document.querySelector('meta[property="og:title"]').content).toBe('Updated Title');
    expect(document.querySelector('meta[name="description"]').content).toBe('Updated description.');
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
  });

  it('removes injected tags on unmount', () => {
    const { unmount } = renderHook(() => useSEO(BASE));
    expect(document.getElementById('seo-jsonld')).not.toBeNull();

    unmount();

    expect(document.querySelector('meta[name="description"]')).toBeNull();
    expect(document.getElementById('seo-jsonld')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('restores the previous title and only removes injected tags on unmount', () => {
    document.title = 'Standalone Page | Pehenavas';

    const { unmount } = renderHook(() => useSEO(BASE));
    expect(document.title).toBe(BASE.title);

    unmount();

    expect(document.title).toBe('Standalone Page | Pehenavas');
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});