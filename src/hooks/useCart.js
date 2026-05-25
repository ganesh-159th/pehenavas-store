import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';

export const useCart = () => {
  return useStore(useShallow((state) => ({
    cart: state.cart,
    isCartOpen: state.isCartOpen,
    setIsCartOpen: state.setIsCartOpen,
    addToCart: state.addToCart,
    removeFromCart: state.removeFromCart,
    updateItemQuantity: state.updateItemQuantity,
    clearCart: state.clearCart,
    toastMessage: state.toastMessage,
    hideToast: state.hideToast,
    cartTotal: state.cart.reduce((total, item) => total + item.price * item.qty, 0),
  })));
};