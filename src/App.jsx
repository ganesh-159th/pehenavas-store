import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Menu, Heart, Facebook, Instagram, Twitter, ArrowUp, CheckCircle2, X } from 'lucide-react';
const Home = lazy(() => import('./components/Home'));
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Account from './components/Account';
const ProductDetail = lazy(() => import('./components/ProductDetail'));
import Cart from './components/Cart';
import Orders from './components/Orders';
import Checkout from './components/Checkout';
import Wishlist from './components/Wishlist';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import Terms from './components/Terms';
import NotFound from './components/NotFound';
import { useUser } from './hooks/useUser';
import { useCart } from './hooks/useCart';
import { useStore } from './store/useStore';

const RoyalLotus = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s-8-4.5-8-11.8A6 6 0 0 1 10 4.3" />
        <path d="M12 22s8-4.5 8-11.8A6 6 0 0 0 14 4.3" />
        <path d="M12 22V12" />
        <path d="M12 12a3 3 0 0 1-3-3 3 3 0 0 1 6 0 3 3 0 0 1-3 3z" />
        <path d="M12 2c-.8 0-1.5.7-1.5 1.5S11.2 5 12 5s1.5-.7 1.5-1.5S12.8 2 12 2z" />
    </svg>
);

export default function App() {
    const { user, logout } = useUser();
    const { cart, isCartOpen, setIsCartOpen, toastMessage, hideToast } = useCart();
    const [searchQuery, setSearchQuery] = useState("");
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { products } = useStore();
    const isAdminPage = location.pathname.startsWith('/admin');

    useEffect(() => {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader?.remove(), 400);
        }
    }, []);

    const searchResults = useMemo(() => {
        if (searchQuery.trim() === "") {
            return [];
        } else {
            return products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
    }, [searchQuery, products]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Close search on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        if (isSearchOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isSearchOpen]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleCartClick = () => {
        if (cart.length > 0) {
            if (user) {
                navigate('/checkout');
            } else {
                navigate('/signin', { state: { message: "Please sign in or create an account to make a payment." } });
            }
        } else {
            setIsCartOpen(!isCartOpen);
        }
    }

    return (
        <div className="min-h-screen bg-[#faf6f0] font-sans text-gray-900">
            <header className="bg-rose-950 text-white sticky top-0 z-40 border-b-4 border-amber-500 shadow-md">
                <div className="bg-amber-500 text-rose-950 text-xs md:text-sm font-bold text-center py-1.5 px-4 tracking-wide">
                    Sandbox Testing Environment - <Link to="/terms" className="underline hover:text-rose-800">No Real Transactions</Link>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        <div className="flex items-center gap-4">
                            <button className="p-1 hover:ring-2 ring-amber-400 rounded md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                                <div className="text-amber-400 p-1.5 rounded-full border border-amber-400/30 group-hover:scale-110 transition-transform hidden sm:block">
                                    <RoyalLotus className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-widest font-serif text-white uppercase leading-none">
                                        PEHENAVAS
                                    </h1>
                                    <span className="text-[0.6rem] text-amber-400 tracking-[0.3em] font-sans uppercase opacity-80 mt-1">The Royal Heritage</span>
                                </div>
                            </Link>
                        </div>
                        <div className="flex-1 hidden"></div>
                        <div className="flex items-center gap-2 sm:gap-6">
                            {!isAdminPage && location.pathname !== '/signin' && location.pathname !== '/signup' && (
                                <button className="p-1 hover:ring-2 ring-amber-400 rounded" onClick={() => setIsSearchOpen(true)}>
                                    <Search className="w-6 h-6" />
                                </button>
                            )}
                            {user ? (
                                <div className="hidden sm:block cursor-pointer hover:border-amber-400 border border-transparent p-1 rounded transition-colors">
                                    <Link to="/account" className="text-xs text-rose-200">Hello, {user.name}</Link>
                                    <button className="text-sm font-bold flex items-center gap-1" onClick={logout}>Logout</button>
                                </div>
                            ) : (
                                <Link to="/signin" className="hidden sm:block cursor-pointer hover:border-amber-400 border border-transparent p-1 rounded transition-colors">
                                    <span className="text-xs text-rose-200 block">Namaste, Sign in</span>
                                    <span className="text-sm font-bold flex items-center gap-1">Account & Orders</span>
                                </Link>
                            )}
                            {!isAdminPage && location.pathname !== '/signin' && location.pathname !== '/signup' && (
                                <>
                                <Link to="/wishlist" className="flex items-center gap-1 cursor-pointer hover:border-amber-400 border border-transparent p-1 rounded relative transition-colors">
                                    <Heart className="w-7 h-7 text-amber-400" />
                                    <span className="hidden sm:block text-sm font-bold mt-3 text-amber-400">Wishlist</span>
                                </Link>
                                <button onClick={handleCartClick} className="flex items-center gap-1 cursor-pointer hover:border-amber-400 border border-transparent p-1 rounded relative transition-colors">
                                    <ShoppingCart className="w-8 h-8 text-amber-400" />
                                    {cart.length > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {cart.length}
                                        </span>
                                    )}
                                    <span className="hidden sm:block text-sm font-bold mt-3 text-amber-400">Cart</span>
                                </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-rose-950 text-white p-4">
                        <ul className="space-y-4">
                            <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>
                            <li><Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>Account</Link></li>
                            <li><Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link></li>
                            <li><Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>Wishlist</Link></li>
                            {cart.length > 0 && location.pathname !== '/signin' && location.pathname !== '/signup' && (
                                <li><Link to={user ? "/checkout" : "/signin"} state={!user ? { message: "Please sign in or create an account to make a payment." } : null} onClick={() => setIsMobileMenuOpen(false)}>Checkout</Link></li>
                            )}
                            <li className="border-t border-rose-800 pt-4">
                                {user ? (
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-left">Logout</button>
                                ) : (
                                    <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                                )}
                            </li>
                        </ul>
                    </div>
                )}
            </header>

            {/* Centered Search Modal */}
            {isSearchOpen && location.pathname !== '/signin' && location.pathname !== '/signup' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Search Input */}
                        <div className="p-6 bg-gradient-to-b from-rose-50 to-white border-b border-rose-100">
                            <div className="flex items-center gap-4 bg-white border-2 border-amber-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/20 transition-all duration-300 transform hover:-translate-y-0.5 focus-within:-translate-y-1">
                                <Search className="w-6 h-6 text-amber-500" />
                                <input
                                    type="text"
                                    placeholder="Search for royal heritage products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400 text-rose-950 font-medium"
                                />
                                <button 
                                    onClick={() => setIsSearchOpen(false)}
                                    className="text-gray-400 hover:text-rose-950 bg-rose-50 hover:bg-amber-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Search Results */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50">
                            {searchQuery.trim() === "" ? (
                                <div className="p-12 text-center text-gray-500">
                                    <p className="text-lg">Start typing to search our collection</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <p className="text-lg">No products found matching "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
                                    {searchResults.map((product) => (
                                        <Link
                                            to={`/product/${product.id}`}
                                            key={product.id}
                                            onClick={() => setIsSearchOpen(false)}
                                            className="cursor-pointer group block"
                                        >
                                            <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-3 aspect-[3/4] shadow-sm border border-gray-100">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-amber-600 font-bold text-sm">₹{product.price.toLocaleString()}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                                <span>⭐ {product.rating}</span>
                                                <span>({product.reviews})</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isAdminPage && location.pathname !== '/signin' && location.pathname !== '/signup' && <Cart />}

            {/* Global Interactive Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-10 right-10 bg-rose-950 text-amber-400 py-4 px-6 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-in-right z-50 border border-amber-500/30">
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{toastMessage}</p>
                    <div className="flex items-center gap-2 border-l border-rose-800 pl-4 ml-2">
                        <button onClick={() => { hideToast(); setIsCartOpen(true); }} className="text-xs bg-amber-500 text-rose-950 px-3 py-1.5 rounded font-bold hover:bg-amber-400 transition-colors uppercase tracking-wider whitespace-nowrap">
                            View Cart
                        </button>
                        <button onClick={hideToast} className="text-rose-300 hover:text-white transition-colors p-1" aria-label="Close">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Suspense fallback={<div className="flex items-center justify-center py-24 text-rose-950 font-serif text-xl tracking-widest">Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Home products={products} searchResults={searchResults} searchQuery={searchQuery} />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>

            <footer className="bg-rose-950 text-rose-200 font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                        <div>
                            <h3 className="font-bold text-white mb-4">Get to Know Us</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="hover:underline">About Us</a></li>
                                <li><a href="#" className="hover:underline">Careers</a></li>
                                <li><a href="#" className="hover:underline">Press Releases</a></li>
                                <li><a href="#" className="hover:underline">Pehenavas Science</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Connect with Us</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="hover:underline">Facebook</a></li>
                                <li><a href="#" className="hover:underline">Twitter</a></li>
                                <li><a href="#" className="hover:.underline">Instagram</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Make Money with Us</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="hover:underline">Sell on Pehenavas</a></li>
                                <li><a href="#" className="hover:underline">Sell under Pehenavas Accelerator</a></li>
                                <li><a href="#" className="hover:underline">Become an Affiliate</a></li>
                                <li><a href="#" className="hover:underline">Advertise Your Products</a></li>
                                <li><a href="#" className="hover:underline">Pehenavas Pay on Merchants</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Let Us Help You</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="hover:underline">COVID-19 and Pehenavas</a></li>
                                <li><a href="#" className="hover:underline">Your Account</a></li>
                                <li><a href="#" className="hover:underline">Returns Centre</a></li>
                                <li><a href="#" className="hover:underline">100% Purchase Protection</a></li>
                                <li><a href="#" className="hover:underline">Pehenavas App Download</a></li>
                                <li><a href="#" className="hover:underline">Help</a></li>
                                <li><Link to="/admin/login" className="hover:underline text-amber-400 font-semibold">Admin Portal</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="border-t border-rose-800 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center gap-3 mb-4 sm:mb-0">
                            <RoyalLotus className="w-8 h-8 text-amber-400" />
                            <span className="text-xl font-bold tracking-widest font-serif text-white uppercase">PEHENAVAS</span>
                        </div>
                        <p className="text-sm text-rose-300">&copy; 2026, Pehenavas.com, Inc. or its affiliates</p>
                    </div>
                </div>
            </footer>

            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-10 right-10 bg-amber-500 text-rose-950 p-3 rounded-full shadow-lg hover:bg-amber-400 transition-all"
                >
                    <ArrowUp size={24} />
                </button>
            )}
        </div>
    );
}