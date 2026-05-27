import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRODUCTS } from '../data/products.js';
import { showAlert } from '../utils/alert';

export const useStore = create(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      isCartOpen: false,
      isAdminAuthenticated: false,
      toastMessage: null,

      // Initialize store with real storefront products
      products: PRODUCTS,

      addProduct: (product) => set((state) => ({
        products: [{ ...product, id: Date.now().toString() }, ...state.products]
      })),

      removeProduct: (id) => {
        set((state) => {
          const product = state.products.find(p => p.id === id);
          if (product) {
            setTimeout(() => showAlert(`"${product.name}" removed from catalog.`, 'danger'), 0);
          }
          return { products: state.products.filter(p => p.id !== id) };
        });
      },

      // Drawer State
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setIsCartOpen: (open) => set({ isCartOpen: open }),

      // Cart Actions
      addToCart: (product, size = 'M') => {
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.id === product.id && item.size === size
          );

          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id && item.size === size
                  ? { ...item, qty: item.qty + 1 }
                  : item
              ),
              isCartOpen: true,
              toastMessage: `${product.name} added to cart!`,
            };
          }

          return {
            cart: [...state.cart, { ...product, size, qty: 1 }],
            isCartOpen: true,
            toastMessage: `${product.name} added to cart!`,
          };
        });
      },

      removeFromCart: (productId, size) => {
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.id === productId && i.size === size)
          ),
        }));
      },

      updateItemQuantity: (id, size, qty) => {
        if (qty < 1) {
          set((state) => ({
            cart: state.cart.filter((i) => !(i.id === id && i.size === size))
          }));
          return;
        }
        set((state) => ({
          cart: state.cart.map(item =>
            item.id === id && item.size === size ? { ...item, qty } : item
          ),
        }));
      },

      updateQuantity: (productId, size, amount) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === productId && item.size === size) {
              return { ...item, qty: Math.max(1, item.qty + amount) };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ cart: [] }),
      hideToast: () => set({ toastMessage: null }),

      // Admin Auth
      adminLogin: (username, password) => {
        if (username === 'admin' && password === 'admin123') {
          set({ isAdminAuthenticated: true });
          return true;
        }
        return false;
      },
      adminLogout: () => set({ isAdminAuthenticated: false }),

      // Wishlist Actions
      toggleWishlist: (product) => {
        set((state) => {
          const exists = state.wishlist.some((item) => item.id === product.id);
          if (exists) return { wishlist: state.wishlist.filter((item) => item.id !== product.id) };
          return { wishlist: [...state.wishlist, product] };
        });
      },
    }),
    {
      name: 'pehenavas-storage',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist, isAdminAuthenticated: state.isAdminAuthenticated, products: state.products }),
    }
  )
);