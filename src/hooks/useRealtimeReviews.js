import { useState, useEffect, useMemo } from 'react';

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

    let unsub = null;

    import('../firebase').then(({ db }) => {
      if (!db) return;
      import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
        const q = query(collection(db, 'reviews'), where('productId', '==', String(productId)));
        unsub = onSnapshot(q, (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRawReviews(list);
          setHasLoaded(true);
        });
      });
    });

    return () => { if (unsub) unsub(); };
  }, [productId]);

  const reviews = useMemo(() => sortReviews(rawReviews, sort), [rawReviews, sort]);

  return { reviews, loading: !hasLoaded };
}
