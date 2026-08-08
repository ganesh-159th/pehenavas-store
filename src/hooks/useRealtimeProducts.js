import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { adminApi } from '../services/api';

const POLL_INTERVAL_MS = 5000;

export function useRealtimeProducts() {
  const setServerConnected = useStore((s) => s.setServerConnected);

  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const normalize = (product) => ({
      ...product,
      rating: product.rating ?? 0,
      reviews: product.reviews ?? 0,
      originalPrice: product.originalPrice ?? product.price,
      colors: product.colors ?? [],
      description: product.description ?? '',
      stock: product.stock ?? 0,
    });

    const sync = async () => {
      try {
        const products = await adminApi.getProducts();
        if (cancelled) return;
        useStore.getState().syncProducts(products.map(normalize));
        setServerConnected(true);
      } catch {
        if (cancelled) return;
        setServerConnected(false);
      }
    };

    sync();
    timerId = setInterval(sync, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [setServerConnected]);
}
