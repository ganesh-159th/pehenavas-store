import React from 'react';
import { CheckCircle2, Sparkles, Package, Truck } from 'lucide-react';
import { formatINR } from '../utils';
import { useFadeIn } from '../hooks/useFadeIn';

const OrderSummary = ({ cart, cartTotal, orderDetails, address, paymentMethod, onBackToShopping }) => {
    const isVisible = useFadeIn();

    return (
    <div className={`bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 md:p-12 text-center max-w-3xl mx-auto my-8 transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="w-20 h-20 text-green-600 animate-pulse" />
            </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-serif font-bold text-rose-950 mt-2">Thank You!</h2>
        <p className="text-rose-800/90 mt-4 text-lg">Your royal order has been placed successfully.</p>
        <p className="text-gray-600 text-sm mt-1">A confirmation scroll has been sent to your email.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-rose-50/50 rounded-xl p-6 mt-8 border border-rose-100 text-left">
            <div>
                <p className="text-xs text-rose-500 uppercase tracking-wider font-bold mb-1">Order Number</p>
                <p className="font-bold text-rose-950 truncate">{orderDetails.id}</p>
            </div>
            <div>
                <p className="text-xs text-rose-500 uppercase tracking-wider font-bold mb-1">Date</p>
                <p className="font-bold text-rose-950">{orderDetails.date}</p>
            </div>
            <div>
                <p className="text-xs text-rose-500 uppercase tracking-wider font-bold mb-1">Total Amount</p>
                <p className="font-bold text-rose-950">{formatINR(cartTotal)}</p>
            </div>
            <div>
                <p className="text-xs text-rose-500 uppercase tracking-wider font-bold mb-1">Payment Method</p>
                <p className="font-bold text-rose-950 capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Card' : 'Prepaid'}</p>
            </div>
        </div>

        <div className="my-10 text-left">
            <h3 className="text-2xl font-serif font-bold text-rose-950 mb-6 border-b border-rose-100 pb-3 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-500" /> Order Details
            </h3>
            <div className="space-y-6">
                {cart.map(item => (
                    <div key={`${item.id}-${item.size}`} className="flex justify-between items-start gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-20 h-24 bg-white border border-rose-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm p-1">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-rose-950 line-clamp-2">{item.name}</p>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-rose-700 mt-1">
                                    <span className="bg-rose-100 px-2 py-0.5 rounded text-xs font-bold">Qty: {item.qty}</span>
                                    {item.size && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">Size: {item.size}</span>}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">{formatINR(item.price)} each</p>
                            </div>
                        </div>
                        <p className="font-bold text-lg text-rose-950">{formatINR(item.price * item.qty)}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-gradient-to-r from-rose-50 to-[#faf6f0] p-6 rounded-xl border border-amber-200 text-left mb-10">
            <div className="flex justify-between items-center mb-2">
                <span className="text-rose-800">Subtotal</span>
                <span className="font-bold text-rose-950">{formatINR(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
                <span className="text-rose-800">Delivery Fee</span>
                <span className="font-bold text-green-600 tracking-wide">FREE</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-rose-200">
                <span className="text-xl font-serif font-bold text-rose-950">Grand Total</span>
                <span className="text-2xl font-serif font-bold text-amber-600">{formatINR(cartTotal)}</span>
            </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-rose-800 bg-amber-50 py-4 px-6 rounded-xl border border-amber-100 mb-10">
            <Truck className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <p className="font-medium text-sm sm:text-base">Estimated Delivery by <span className="font-bold text-rose-950">{orderDetails.delivery}</span></p>
        </div>

        {address && (
            <div className="bg-rose-50/50 rounded-xl p-6 border border-rose-100 text-left mb-8">
                <h4 className="font-bold text-rose-950 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-amber-500" /> Shipping Address</h4>
                <p className="text-gray-700 text-sm">{address.fullName}</p>
                <p className="text-gray-700 text-sm">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p className="text-gray-700 text-sm">{address.city}, {address.state} - {address.pincode}</p>
                <p className="text-gray-700 text-sm">Phone: {address.phone}</p>
            </div>
        )}

        <button
            onClick={onBackToShopping}
            className="w-full sm:w-auto mx-auto bg-gradient-to-r from-rose-950 to-rose-900 text-amber-400 font-bold py-4 px-10 rounded-xl hover:from-rose-900 hover:to-rose-800 transition-all shadow-xl hover:shadow-2xl text-lg flex items-center justify-center gap-3 transform hover:-translate-y-1"
        >
            <Sparkles className="w-6 h-6" /> Continue Your Royal Journey
        </button>
    </div>
    );
};

export default OrderSummary;
