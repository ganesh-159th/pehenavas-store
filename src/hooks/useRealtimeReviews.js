import { useState, useEffect, useMemo } from 'react';
import { getProductReviews } from '../services/reviews';

const POLL_INTERVAL_MS = 10000;

function sortReviews(list, sort) {
  const sorted = [...list];
  switch (sort) {
    case 'highest':  sorted.sort((a, b) => b.rating - a.rating); break;
    case 'lowest':   sorted.sort((a, b) => a.rating - b.rating); break;
    case 'helpful':  sorted.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0)); break;
    default:         sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return sorted;
}

export function useRealtimeReviews(productId, sort = 'recent') {
  const [rawReviews, setRawReviews] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    let timerId = null;

    const sync = async () => {
      try {
        const list = await getProductReviews(productId, sort);
        if (cancelled) return;
        setRawReviews(list);
        setHasLoaded(true);
      } catch {
        if (!cancelled) setHasLoaded(true);
      }
    };

    sync();
    timerId = setInterval(sync, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [productId, sort]);

  const reviews = useMemo(() => sortReviews(rawReviews, sort), [rawReviews, sort]);

  return { reviews, loading: !hasLoaded };
}
