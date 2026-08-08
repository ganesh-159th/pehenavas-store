import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, ArrowLeft, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { formatINR } from '../utils.js';
import { useCart } from '../hooks/useCart';
import { useFadeIn } from '../hooks/useFadeIn';
import { useStore } from '../store/useStore';
import { useUser } from '../hooks/useUser';
import { useRealtimeReviews } from '../hooks/useRealtimeReviews';
import { addReview, updateReview, batchHelpfulStatus } from '../services/reviews';
import RatingBreakdown from './RatingBreakdown';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import ReviewSortBar from './ReviewSortBar';

const REVIEWS_PER_PAGE = 5;

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isVisible = useFadeIn();
    const { addToCart } = useCart();
    const { user } = useUser();
    const storeProducts = useStore((state) => state.products);
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState(null);
    const [helpfulMap, setHelpfulMap] = useState({});
    const [sort, setSort] = useState('recent');
    const [submitting, setSubmitting] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
    const [error, setError] = useState('');
    const [formKey, setFormKey] = useState(0);

    const product = storeProducts.find(p => String(p.id) === String(id));
    const { reviews, loading: loadingReviews } = useRealtimeReviews(product?.id, sort);

    useEffect(() => {
        if (!user || reviews.length === 0) return;
        let cancelled = false;
        batchHelpfulStatus(reviews.map(r => r.id))
            .then(m => { if (!cancelled) setHelpfulMap(m); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [reviews, user]);

    const stats = product ? {
        averageRating: product.rating || 0,
        totalReviews: product.reviews || 0,
        distribution: product.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    } : null;

    const avgRating = stats?.averageRating ?? product?.rating ?? 0;

    const handleSubmitReview = async ({ rating, comment }) => {
        if (!user) return;
        setSubmitting(true);
        setError('');
        try {
            await addReview({ productId: product.id, rating, comment });
            setFormKey(k => k + 1);
            setVisibleCount(REVIEWS_PER_PAGE);
        } catch (err) {
            setError(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateReview = async ({ rating, comment }) => {
        if (!user || !editingReview) return;
        setSubmitting(true);
        setError('');
        try {
            await updateReview(editingReview.id, { rating, comment });
            setEditingReview(null);
        } catch (err) {
            setError(err.message || 'Failed to update review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletedReview = () => {
        setVisibleCount(REVIEWS_PER_PAGE);
    };

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

    const visibleReviews = reviews.slice(0, visibleCount);
    const hasMore = visibleCount < reviews.length;

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

                {/* Rating Breakdown */}
                <div className="mb-8">
                    <RatingBreakdown stats={stats} />
                </div>

                {/* Review Form */}
                {user ? (
                    editingReview ? (
                        <div className="mb-8">
                            <ReviewForm
                                initialRating={editingReview.rating}
                                initialComment={editingReview.comment}
                                onSubmit={handleUpdateReview}
                                onCancel={() => setEditingReview(null)}
                                isEditing
                                submitting={submitting}
                            />
                        </div>
                    ) : (
                        <div className="mb-8">
                            <ReviewForm
                                key={`new-${formKey}`}
                                onSubmit={handleSubmitReview}
                                submitting={submitting}
                            />
                        </div>
                    )
                ) : (
                    <div className="bg-rose-50/50 rounded-xl p-6 border border-rose-100 mb-8 text-center">
                        <p className="text-rose-900/60">
                            <Link to="/signin" className="text-amber-600 font-bold hover:underline">Sign in</Link> to leave a review.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-6">{error}</div>
                )}

                {/* Sort Bar */}
                {reviews.length > 0 && (
                    <div className="mb-4">
                        <ReviewSortBar sort={sort} onSortChange={setSort} reviewCount={reviews.length} />
                    </div>
                )}

                {/* Reviews List */}
                {loadingReviews ? (
                    <div className="text-center py-8 text-rose-900/60">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-rose-900/60">No reviews yet. Be the first to review!</div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {visibleReviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    helpfulStatus={helpfulMap[review.id]}
                                    onEdit={setEditingReview}
                                    onDeleted={handleDeletedReview}
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <button
                                onClick={() => setVisibleCount(v => v + REVIEWS_PER_PAGE)}
                                className="mt-6 w-full py-3 text-sm font-medium text-rose-900/60 hover:text-rose-950 border border-rose-200 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-1"
                            >
                                <ChevronDown className="w-4 h-4" /> Show More Reviews
                            </button>
                        )}
                        {visibleCount > REVIEWS_PER_PAGE && (
                            <button
                                onClick={() => setVisibleCount(REVIEWS_PER_PAGE)}
                                className="mt-2 w-full py-3 text-sm font-medium text-rose-900/40 hover:text-rose-900/70 transition-all flex items-center justify-center gap-1"
                            >
                                <ChevronUp className="w-4 h-4" /> Show Less
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
