import { useEffect } from 'react';

const SEO_JSONLD_ID = 'seo-jsonld';

// Upsert a meta tag. Returns the element only when it was created by this hook,
// so cleanup never removes tags that exist statically in index.html.
function upsertMeta(attribute, name, content) {
  const existing = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (existing) {
    existing.setAttribute('content', content);
    return null;
  }
  const el = document.createElement('meta');
  el.setAttribute(attribute, name);
  el.setAttribute('content', content);
  document.head.appendChild(el);
  return el;
}

function upsertCanonical(href) {
  const existing = document.head.querySelector('link[rel="canonical"]');
  if (existing) {
    existing.setAttribute('href', href);
    return null;
  }
  const el = document.createElement('link');
  el.setAttribute('rel', 'canonical');
  el.setAttribute('href', href);
  document.head.appendChild(el);
  return el;
}

function upsertJsonLd(jsonLd) {
  const existing = document.getElementById(SEO_JSONLD_ID);
  if (existing) {
    existing.textContent = JSON.stringify(jsonLd);
    return null;
  }
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.id = SEO_JSONLD_ID;
  el.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(el);
  return el;
}

/**
 * Client-side SEO: sets the document title, meta description, Open Graph /
 * Twitter card tags, canonical URL, and injects a JSON-LD structured-data
 * script for the current page.
 *
 * All injected tags are cleaned up on unmount; tags already present in the
 * static index.html are updated in place instead of being removed.
 */
export function useSEO({ title, description, image, url, type = 'website', jsonLd } = {}) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const created = [];
    const finalUrl = url || window.location.href;
    const finalTitle = title || document.title;

    const metaDefs = [
      ['name', 'description', description],
      ['property', 'og:site_name', 'Pehenavas'],
      ['property', 'og:type', type],
      ['property', 'og:title', finalTitle],
      ['property', 'og:description', description],
      ['property', 'og:image', image],
      ['property', 'og:url', finalUrl],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', finalTitle],
      ['name', 'twitter:description', description],
      ['name', 'twitter:image', image],
    ].filter(([, , value]) => value != null && value !== '');

    document.title = finalTitle;

    for (const [attribute, name, value] of metaDefs) {
      const el = upsertMeta(attribute, name, value);
      if (el) created.push(el);
    }

    const canonical = upsertCanonical(finalUrl);
    if (canonical) created.push(canonical);

    if (jsonLdString) {
      const script = upsertJsonLd(JSON.parse(jsonLdString));
      if (script) created.push(script);
    }

    return () => {
      created.forEach((el) => el.remove());
    };
  }, [title, description, image, url, type, jsonLdString]);
}