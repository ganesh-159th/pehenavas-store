import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, ArrowLeft } from 'lucide-react';
import { PRODUCTS } from '../data/products.js';
import { formatINR } from '../utils.js';
import { useCart } from '../hooks/useCart';
import { useFadeIn } from '../hooks/useFadeIn';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isVisible = useFadeIn();
    const { addToCart } = useCart();
    const [selectedSize, setSelectedSize] = useState('M');

    // Find the product, ensuring we convert both IDs to strings for a safe match
    const product = PRODUCTS.find(p => String(p.id) === String(id));

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
                                <Star key={i} className={`w-6 h-6 ${i < Math.floor(product.rating) ? 'fill-current' : 'stroke-current'}`} />
                            ))}
                        </div>
                        <span className="text-gray-500 text-sm">({product.reviews} reviews)</span>
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
                    <div className="flex items-baseline gap-4 mt-8">
                        <span className="text-5xl font-serif font-bold text-amber-600">{formatINR(product.price)}</span>
                        <span className="text-gray-400 line-through">{formatINR(product.price * 1.2)}</span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="mt-8 w-full bg-rose-950 text-amber-400 font-bold py-4 px-6 rounded-md hover:bg-rose-900 transition-all shadow-lg hover:shadow-xl text-xl flex items-center justify-center gap-3"
                    >
                        <ShoppingCart className="w-6 h-6" /> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;