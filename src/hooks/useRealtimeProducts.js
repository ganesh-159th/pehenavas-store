import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export function useRealtimeProducts() {
  const setServerConnected = useStore((s) => s.setServerConnected);
  const synced = useRef(false);

  useEffect(() => {
    let unsub = null;

    import('../firebase').then(({ db }) => {
      if (!db) return;
      import('firebase/firestore').then(({ collection, onSnapshot }) => {
        unsub = onSnapshot(collection(db, 'products'), (snap) => {
          const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          useStore.getState().syncProducts(products);
          if (!synced.current) {
            synced.current = true;
            setServerConnected(true);
          }
        });
      });
    });

    return () => { if (unsub) unsub(); };
  }, [setServerConnected]);
}
