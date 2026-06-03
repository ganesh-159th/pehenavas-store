import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, ArrowLeft, MessageSquare } from 'lucide-react';
import { formatINR } from '../utils.js';
import { useCart } from '../hooks/useCart';
import { useFadeIn } from '../hooks/useFadeIn';
import { useStore } from '../store/useStore';
import { useUser } from '../hooks/useUser';
import { addReview, getProductReviews } from '../services/reviews';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isVisible = useFadeIn();
    const { addToCart } = useCart();
    const { user } = useUser();
    const storeProducts = useStore((state) => state.products);
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const product = storeProducts.find(p => String(p.id) === String(id));

    useEffect(() => {
      if (!product) return;
      getProductReviews(product.id)
        .then(setReviews)
        .catch(() => {})
        .finally(() => setLoadingReviews(false));
    }, [product]);

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : product?.rating ?? 0;

    const handleSubmitReview = async (e) => {
      e.preventDefault();
      if (!user || !comment.trim()) return;
      setSubmitting(true);
      try {
        await addReview({
          productId: product.id,
          userId: user.uid,
          userName: user.name,
          rating,
          comment: comment.trim(),
        });
        setComment('');
        setRating(5);
        const updated = await getProductReviews(product.id);
        setReviews(updated);
      } catch {
        // review submission failed silently
      } finally {
        setSubmitting(false);
      }
    };

    // Dynamically update the document title for SEO and UX
    useEffect(() => {
        if (product) {
            document.title = `${product.name} | Pehenavas`;
        } else {
            document.title = 'Product Not Found | Pehenavas';
        }
    }, [product]);

    if (!product) {
        return (
            <div className={`text-center py-24 transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <h2 className="text-3xl font-bold text-rose-950 font-serif mb-4">Product Not Found</h2>
                <p className="text-gray-600 mb-8">The item you are looking for does not exist or has been removed.</p>
                <Link to="/" className="inline-flex items-center justify-center bg-rose-950 text-amber-400 font-bold py-3 px-8 rounded-md hover:bg-rose-900 transition-all shadow-md">
                    Return to Store
                </Link>
            </div>
        );
    }

    const handleAddToCart = () => {
        addToCart(product, selectedSize);
    };

    return (
        <div className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-rose-100/80 overflow-hidden transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-rose-700 hover:text-rose-900 hover:underline flex items-center text-sm font-medium transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 p-6 pt-0">
                <div className="rounded-lg overflow-hidden border border-rose-100 shadow-inner aspect-[3/4] md:aspect-auto md:h-[600px]">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl font-serif font-bold text-rose-950">{product.name}</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-6 h-6 ${i < Math.floor(Number(avgRating)) ? 'fill-current' : 'stroke-current'}`} />
                            ))}
                        </div>
                        <span className="text-gray-500 text-sm">{avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                    </div>
                    <p className="text-rose-800/90 mt-6 text-lg leading-relaxed">{product.description}</p>
                    <div className="mt-8">
                        <p className="text-gray-500 text-sm">Size:</p>
                        <div className="flex gap-2 mt-2">
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
                    </div>
                    {product.colors && (
                      <div className="mt-6">
                        <p className="text-gray-500 text-sm">Color:</p>
                        <div className="flex gap-2 mt-2">
                          {product.colors.map(c => (
                            <button
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-colors ${
                                selectedColor === c
                                  ? 'bg-rose-950 text-white border-rose-950'
                                  : 'bg-white hover:border-rose-400 border-rose-200 text-gray-700'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-baseline gap-4 mt-8">
                        <span className="text-5xl font-serif font-bold text-amber-600">{formatINR(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through">{formatINR(product.originalPrice)}</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="mt-8 w-full bg-rose-950 text-amber-400 font-bold py-4 px-6 rounded-md hover:bg-rose-900 transition-all shadow-lg hover:shadow-xl text-xl flex items-center justify-center gap-3"
                    >
                        <ShoppingCart className="w-6 h-6" /> Add to Cart
                    </button>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-rose-100 px-6 py-8">
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="w-6 h-6 text-amber-500" />
                    <h2 className="text-2xl font-serif font-bold text-rose-950">Customer Reviews</h2>
                </div>

                {/* Review Form */}
                {user ? (
                    <form onSubmit={handleSubmitReview} className="bg-rose-50/50 rounded-xl p-6 border border-rose-100 mb-8">
                        <h3 className="font-bold text-rose-950 mb-3">Write a Review</h3>
                        <div className="flex items-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setRating(star)} className="text-amber-500 hover:scale-110 transition-transform">
                                    <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : 'stroke-current'}`} />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-rose-900/60 font-medium">{rating}/5</span>
                        </div>
                        <textarea
                            rows="3"
                            placeholder="Share your experience with this product..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border-2 border-rose-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white resize-none"
                            required
                        />
                        <button
                            type="submit"
                            disabled={submitting || !comment.trim()}
                            className="mt-4 bg-amber-500 text-rose-950 font-bold py-3 px-8 rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-rose-50/50 rounded-xl p-6 border border-rose-100 mb-8 text-center">
                        <p className="text-rose-900/60">
                            <Link to="/signin" className="text-amber-600 font-bold hover:underline">Sign in</Link> to leave a review.
                        </p>
                    </div>
                )}

                {/* Reviews List */}
                {loadingReviews ? (
                    <div className="text-center py-8 text-rose-900/60">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-rose-900/60">No reviews yet. Be the first to review!</div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-xl p-5 border border-rose-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-rose-950 text-amber-400 flex items-center justify-center font-bold text-sm">
                                            {review.userName?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <span className="font-bold text-rose-950 text-sm">{review.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'stroke-current text-gray-300'}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-rose-900/80 text-sm leading-relaxed">{review.comment}</p>
                                {review.date && (
                                    <p className="text-xs text-rose-900/40 mt-2">
                                        {new Date(review.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;