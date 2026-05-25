import React from 'react';
import { Heart } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function WishlistButton({ product }) {
  const { wishlist, toggleWishlist } = useStore();
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // Prevents navigating to product page if button is over a link
        toggleWishlist(product);
      }}
      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur rounded-full shadow-sm hover:shadow-md transition-all duration-200 group"
      aria-label="Add to wishlist"
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500 group-hover:text-red-500'
        }`}
      />
    </button>
  );
}