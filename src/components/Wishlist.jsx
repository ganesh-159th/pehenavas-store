import React, { useState } from 'react';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useCart } from '../hooks/useCart';
import { formatINR } from '../utils';
import { useFadeIn } from '../hooks/useFadeIn';

const Wishlist = () => {
  const { wishlist, toggleWishlist } = useStore();
  const { addToCart } = useCart();
  const isVisible = useFadeIn();
  const [sizeModal, setSizeModal] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');

  const handleAddToCartWithSize = (product) => {
    addToCart(product, selectedSize);
    setSizeModal(null);
    setSelectedSize('M');
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden min-h-[400px] transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="p-4 sm:p-6 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50/30">
        <div className="flex items-center gap-3">
          <Heart className="w-7 h-7 text-rose-500" />
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-rose-950">My Wishlist</h2>
          {wishlist.length > 0 && (
            <span className="bg-rose-950 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-rose-300" />
          </div>
          <p className="text-xl font-semibold text-gray-500 mb-2">Your wishlist is empty</p>
          <p className="text-gray-400 mb-8">Save your favourite royal heritage pieces here!</p>
          <Link
            to="/"
            className="bg-rose-950 text-amber-400 font-bold py-3 px-8 rounded-md hover:bg-rose-900 transition-all shadow-lg"
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 p-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-rose-100/80 overflow-hidden group relative"
            >
              <Link to={`/product/${product.id}`} className="cursor-pointer block">
                <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-base text-rose-950 line-clamp-2">{product.name}</h3>
                  <p className="font-serif text-base sm:text-lg font-bold text-amber-600 mt-1">{formatINR(product.price)}</p>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:shadow-md transition-all z-10 text-red-500 hover:text-red-600"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setSizeModal(product); setSelectedSize('M'); }}
                className="absolute bottom-2 left-2 right-2 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-rose-950 text-amber-400 text-xs font-bold py-2 px-3 rounded-md hover:bg-rose-900 shadow-lg z-10 flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}

      {sizeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSizeModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-rose-950 font-serif">Select Size</h3>
              <button onClick={() => setSizeModal(null)} className="text-gray-400 hover:text-rose-950">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{sizeModal.name}</p>
            <div className="flex gap-2 mb-6">
              {['S', 'M', 'L', 'XL'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`w-12 h-12 rounded-full border-2 transition-colors ${selectedSize === s ? 'bg-rose-950 text-white border-rose-950' : 'bg-white hover:border-rose-400 border-rose-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleAddToCartWithSize(sizeModal)}
              className="w-full bg-rose-950 text-amber-400 font-bold py-3 px-4 rounded-md hover:bg-rose-900 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
