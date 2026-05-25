import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatINR } from '../utils.js';
import { useUser } from '../hooks/useUser';

const Cart = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateItemQuantity, cartTotal } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();

  if (!isCartOpen) {
    return null;
  }

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/signin', { state: { message: "Please sign in or create an account to make a payment." } });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="cart-heading">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <header className="flex items-center justify-between p-4 border-b">
          <h2 id="cart-heading" className="text-2xl font-bold font-serif text-rose-950">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-rose-100" aria-label="Close cart">
            <X className="w-6 h-6 text-rose-950" />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingCart className="w-24 h-24 text-gray-300" />
            <p className="mt-6 text-xl font-semibold text-gray-500">Your cart is empty</p>
            <p className="mt-2 text-gray-400">Add some items to get started!</p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-8 bg-rose-950 text-amber-400 font-bold py-3 px-6 rounded-md hover:bg-rose-900 transition-all shadow-lg"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex items-start gap-4 py-4 border-b">
                <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-md" />
                <div className="flex-1">
                  <h3 className="font-bold text-rose-950">{item.name}</h3>
                  <p className="text-sm text-gray-500">Size: {item.size}</p>
                  <p className="text-sm text-amber-700 mt-1">{formatINR(item.price)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateItemQuantity(item.id, item.size, item.qty - 1)} className="p-1 rounded-full border border-rose-200 hover:bg-rose-100" aria-label="Decrease quantity">
                      <Minus className="w-4 h-4 text-rose-800" />
                    </button>
                    <span className="font-bold w-8 text-center" aria-label="Current quantity">{item.qty}</span>
                    <button onClick={() => updateItemQuantity(item.id, item.size, item.qty + 1)} className="p-1 rounded-full border border-rose-200 hover:bg-rose-100" aria-label="Increase quantity">
                      <Plus className="w-4 h-4 text-rose-800" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-rose-950">{formatINR(item.price * item.qty)}</p>
                  <button
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="p-1 text-gray-400 hover:text-red-500 text-xs mt-4 hover:underline"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <footer className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-rose-950">
              <span>Subtotal</span>
              <span>{formatINR(cartTotal)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-rose-950 text-amber-400 font-bold py-4 px-6 rounded-md hover:bg-rose-900 transition-all text-lg shadow-lg"
            >
              Proceed to Checkout
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Cart;
