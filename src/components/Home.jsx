import React, { useMemo, useReducer, useEffect, useRef } from 'react';
import { ShoppingCart, Star, X, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import { CATEGORIES } from '../data/categories.js';
import { BANNERS } from '../data/banners.js';
import { formatINR } from '../utils.js';
import { useCart } from '../hooks/useCart';
import { Link } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';
import { useStore } from '../store/useStore';

const initialState = {
    activeCategory: "All",
    quickViewProduct: null,
    currentBanner: 0,
    selectedSize: "M",
    minPrice: '',
    maxPrice: '',
    sortBy: 'default',
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_ACTIVE_CATEGORY':
            return { ...state, activeCategory: action.payload };
        case 'SET_QUICK_VIEW_PRODUCT':
            return { ...state, quickViewProduct: action.payload };
        case 'SET_CURRENT_BANNER':
            return { ...state, currentBanner: action.payload };
        case 'SET_SELECTED_SIZE':
            return { ...state, selectedSize: action.payload };
        case 'SET_MIN_PRICE':
            return { ...state, minPrice: action.payload };
        case 'SET_MAX_PRICE':
            return { ...state, maxPrice: action.payload };
        case 'SET_SORT_BY':
            return { ...state, sortBy: action.payload };
        case 'RESET_ADD_TO_CART':
            return { ...state, quickViewProduct: null, selectedSize: "M" };
        default:
            return state;
    }
}

const Home = ({ searchResults, searchQuery }) => {
    const { addToCart } = useCart();
    const storeProducts = useStore((state) => state.products);
    const products = searchQuery ? searchResults : storeProducts;
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        activeCategory,
        quickViewProduct,
        currentBanner,
        selectedSize,
        minPrice,
        maxPrice,
        sortBy,
    } = state;
    const isVisible = useFadeIn();

    // Auto-slide effect for banner
    const bannerRef = useRef(currentBanner);
    useEffect(() => { bannerRef.current = currentBanner; });
    useEffect(() => {
        if (quickViewProduct) return; // Pause carousel if looking at a product
        const timer = setInterval(() => {
            dispatch({ type: 'SET_CURRENT_BANNER', payload: (bannerRef.current + 1) % BANNERS.length });
        }, 5000);
        return () => clearInterval(timer);
    }, [quickViewProduct]);

    const nextBanner = () => dispatch({ type: 'SET_CURRENT_BANNER', payload: (currentBanner + 1) % BANNERS.length });
    const prevBanner = () => dispatch({ type: 'SET_CURRENT_BANNER', payload: (currentBanner - 1 + BANNERS.length) % BANNERS.length });

    // Close Quick View modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                dispatch({ type: 'SET_QUICK_VIEW_PRODUCT', payload: null });
            }
        };
        if (quickViewProduct) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [quickViewProduct]);

    // --- LOGIC ---
    const productsToDisplay = useMemo(() => {
        let filtered = products.filter(product => {
            const matchesCategory = activeCategory === "All" || product.category === activeCategory;
            const matchesMinPrice = minPrice === '' || product.price >= Number(minPrice);
            const matchesMaxPrice = maxPrice === '' || product.price <= Number(maxPrice);
            return matchesCategory && matchesMinPrice && matchesMaxPrice;
        });
        if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
        if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        return filtered;
    }, [products, activeCategory, minPrice, maxPrice, sortBy]);

    const handleAddToCart = (product) => {
        addToCart(product, selectedSize);
        dispatch({ type: 'RESET_ADD_TO_CART' });
    };

    return (
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                {/* --- BANNER --- */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-rose-900/20 mb-12 h-96">
                        {BANNERS.map((banner, index) => (
                            <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBanner ? 'opacity-100' : 'opacity-0'}`}>
                                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold drop-shadow-lg">{banner.title}</h2>
                                    <p className="max-w-xl mt-2 sm:mt-4 text-sm sm:text-lg text-rose-100/90">{banner.subtitle}</p>
                                    <button className="mt-4 sm:mt-6 bg-amber-500 text-rose-950 font-bold py-2 px-6 sm:py-3 sm:px-8 rounded-md hover:bg-amber-400 transition-all shadow-lg hover:shadow-xl text-base sm:text-lg">{banner.buttonText}</button>
                                </div>
                            </div>
                        ))}
                        <button onClick={prevBanner} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={nextBanner} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* --- CATEGORIES & FILTERS --- */}
                    <div className="mb-8 flex flex-col gap-4">
                        <div className="flex-1 w-full overflow-x-auto hide-scrollbar">
                            <div className="flex gap-2 md:gap-4 border-b-2 border-rose-100 pb-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => dispatch({ type: 'SET_ACTIVE_CATEGORY', payload: cat })}
                                        className={`px-5 py-2 rounded-t-lg text-sm md:text-base font-bold transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-rose-100 text-rose-950' : 'text-gray-500 hover:bg-rose-50/50'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-rose-950" />
                                <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">Price:</span>
                                <input
                                    type="number" min="0" placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => dispatch({ type: 'SET_MIN_PRICE', payload: e.target.value })}
                                    className="w-20 px-2 py-1.5 border border-rose-100/80 rounded-md text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none bg-white/60 backdrop-blur-sm transition-all duration-200 hover:border-rose-300"
                                />
                                <span className="text-rose-300">-</span>
                                <input
                                    type="number" min="0" placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => dispatch({ type: 'SET_MAX_PRICE', payload: e.target.value })}
                                    className="w-20 px-2 py-1.5 border border-rose-100/80 rounded-md text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none bg-white/60 backdrop-blur-sm transition-all duration-200 hover:border-rose-300"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => dispatch({ type: 'SET_SORT_BY', payload: e.target.value })}
                                    className="px-3 py-1.5 border border-rose-100/80 rounded-md text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none bg-white/60 backdrop-blur-sm transition-all duration-200 hover:border-rose-300"
                                >
                                    <option value="default">Default</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* --- PRODUCT GRID --- */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {productsToDisplay.length === 0 ? (
                          <div className="col-span-full py-16 text-center">
                            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                          </div>
                        ) : (
                        productsToDisplay.map(product => (
                            <div
                                key={product.id}
                                className="bg-white/60 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-rose-100/80 overflow-hidden group relative"
                            >
                                <Link
                                    to={`/product/${product.id}`}
                                    className="cursor-pointer block"
                                >
                                    <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                                        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4 sm:p-5">
                                        <h3 className="font-bold text-sm sm:text-lg text-rose-950 line-clamp-2 sm:truncate">{product.name}</h3>
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="font-serif text-base sm:text-xl font-bold text-amber-600">{formatINR(product.price)}</p>
                                            <div className="flex items-center gap-1 text-xs sm:text-sm text-amber-500">
                                                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                                <span className="font-bold hidden sm:inline-block">{product.rating}</span>
                                                <span className="text-gray-400 hidden sm:inline-block">({product.reviews})</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_QUICK_VIEW_PRODUCT', payload: product }) }}
                                    className="absolute top-3 right-3 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white/90 sm:bg-rose-950 text-rose-950 sm:text-amber-400 font-bold p-2 sm:py-2 sm:px-4 rounded-full sm:rounded-md hover:bg-rose-100 sm:hover:bg-rose-900 transition-all shadow-md sm:shadow-lg sm:opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center gap-2 z-10 backdrop-blur-sm sm:backdrop-blur-none"
                                >
                                    <ShoppingCart className="w-5 h-5" /> <span className="hidden sm:inline-block">Quick Add</span>
                                </button>
                            </div>
                        )))}
                    </div>
            {quickViewProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => dispatch({ type: 'SET_QUICK_VIEW_PRODUCT', payload: null })}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="col-span-1 h-64 md:h-auto relative">
                            <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                            <button className="md:hidden absolute top-3 right-3 bg-white/80 p-1.5 rounded-full text-gray-900" onClick={() => dispatch({ type: 'SET_QUICK_VIEW_PRODUCT', payload: null })}><X className="w-5 h-5"/></button>
                        </div>
                        <div className="col-span-1 p-6 md:p-8 flex flex-col justify-center overflow-y-auto">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-rose-950 pr-4">{quickViewProduct.name}</h2>
                                <button className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors" onClick={() => dispatch({ type: 'SET_QUICK_VIEW_PRODUCT', payload: null })}><X className="w-6 h-6"/></button>
                            </div>
                            <p className="font-serif text-2xl md:text-3xl font-bold text-amber-600 mt-2 md:mt-4">{formatINR(quickViewProduct.price)}</p>
                            <div className="mt-4 md:mt-6">
                                <p className="text-gray-500 text-sm">Size:</p>
                                <div className="flex gap-2 mt-2">
                                    {['S', 'M', 'L', 'XL'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => dispatch({ type: 'SET_SELECTED_SIZE', payload: s })}
                                            className={`w-12 h-12 rounded-full border-2 transition-colors ${selectedSize === s ? 'bg-rose-950 text-white border-rose-950' : 'bg-white hover:border-rose-400 border-rose-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddToCart(quickViewProduct)}
                                className="mt-8 w-full bg-rose-950 text-amber-400 font-bold py-4 px-6 rounded-md hover:bg-rose-900 transition-all shadow-lg hover:shadow-xl text-xl flex items-center justify-center gap-3"
                            >
                                <ShoppingCart className="w-6 h-6" /> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Home;
