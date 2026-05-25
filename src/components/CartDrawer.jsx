import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, updateQuantity } = useStore();
  const cartTotal = cart.reduce((total, item) => total + item.price * item.qty, 0);

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Sliding Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-gray-800" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Your Cart</h2>
            <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.length}
            </span>
          </div>
          <button onClick={closeCart} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">Your cart is empty</p>
              <p className="text-sm text-center">Looks like you haven't added anything to your cart yet.</p>
              <button onClick={closeCart} className="mt-4 px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition font-medium">
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0">
                <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Size: <span className="font-medium text-gray-800">{item.size}</span></p>
                    <p className="font-bold text-gray-900 mt-2">₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.size, -1)} className="p-2 hover:bg-gray-50 transition text-gray-600">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.id, item.size, 1)} className="p-2 hover:bg-gray-50 transition text-gray-600">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout Button */}
        {cart.length > 0 && (
          <div className="p-5 border-t bg-gray-50/50">
            <div className="flex justify-between items-center mb-5">
              <span className="text-gray-600 font-medium text-lg">Subtotal</span>
              <span className="text-2xl font-bold text-gray-900">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <Link to="/checkout" onClick={closeCart} className="w-full flex items-center justify-center space-x-2 py-4 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform active:scale-[0.98]">
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}