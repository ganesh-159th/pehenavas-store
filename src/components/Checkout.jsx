import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { formatINR } from '../utils.js';
import { CreditCard, Smartphone, Banknote, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import OrderSummary from './OrderSummary.jsx';
import { useUser } from '../hooks/useUser';
import { Navigate, Link } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';
import { showAlert } from '../utils/alert';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useUser();
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [upiId, setUpiId] = useState("");
    const [upiIdVerified, setUpiIdVerified] = useState(null);
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [finalOrder, setFinalOrder] = useState(null);
    const [errors, setErrors] = useState({});
    const [address, setAddress] = useState({
        fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: ''
    });

    const handleAddressChange = (field, value) => {
        setAddress(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };
    const isVisible = useFadeIn();

    const handleUpiVerification = () => {
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        if (upiRegex.test(upiId)) {
            setUpiIdVerified(true);
            if (errors.upi) setErrors({ ...errors, upi: null });
        } else {
            setUpiIdVerified(false);
        }
    };

    const handleCardNumberChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        setCardNumber(formatted.substring(0, 19));
        if (errors.cardNumber) setErrors({ ...errors, cardNumber: null });
    };

    const handleCardExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        setCardExpiry(val);
        if (errors.cardExpiry) setErrors({ ...errors, cardExpiry: null });
    };

    const handleCardCvvChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        setCardCvv(val.substring(0, 4));
        if (errors.cardCvv) setErrors({ ...errors, cardCvv: null });
    };

    const handlePlaceOrder = () => {
        if (cart.length === 0) return;

        const newErrors = {};
        if (!address.fullName.trim()) newErrors.fullName = 'Full name is required.';
        if (!address.phone.trim() || !/^\d{10}$/.test(address.phone)) newErrors.phone = 'Valid 10-digit phone is required.';
        if (!address.line1.trim()) newErrors.line1 = 'Address line 1 is required.';
        if (!address.city.trim()) newErrors.city = 'City is required.';
        if (!address.state.trim()) newErrors.state = 'State is required.';
        if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode)) newErrors.pincode = 'Valid 6-digit pincode is required.';
        if (paymentMethod === 'upi' && !upiIdVerified) {
            newErrors.upi = "Please verify your UPI ID before placing the order.";
        }
        if (paymentMethod === 'card') {
            if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
                newErrors.cardNumber = "Please enter a valid 16-digit card number.";
            }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                newErrors.cardExpiry = "Please enter a valid expiry date (MM/YY).";
            }
            if (!/^\d{3,4}$/.test(cardCvv)) {
                newErrors.cardCvv = "Please enter a valid CVV.";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showAlert('Please fill in all required fields correctly.', 'warning');
            return;
        }

        setOrderPlaced(true);
        setTimeout(() => {
            const orderId = `PHN-${Math.floor(100000 + Math.random() * 900000)}`;
            const today = new Date();
            const deliveryDate = new Date(today);
            deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 days
            setFinalOrder({ 
                cart: [...cart], 
                cartTotal,
                details: {
                    id: orderId,
                    date: today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
                    delivery: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })
                },
                address: { ...address }
            });
            setShowOrderSummary(true);
            clearCart();
            showAlert('Order placed successfully! 🎉', 'success');
        }, 1000);
    };

    const handleBackToShopping = () => {
        setShowOrderSummary(false);
        setOrderPlaced(false);
        setPaymentMethod("upi");
        setUpiId("");
        setUpiIdVerified(null);
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setErrors({});
        setFinalOrder(null);
        setAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
    };

    const isPlaceOrderDisabled = () => {
        if (cart.length === 0) return true;
        return false;
    }

    if (!user) {
        return <Navigate to="/signin" state={{ message: "Please sign in or create an account to make a payment." }} replace />;
    }

    if (showOrderSummary && finalOrder) {
        return <OrderSummary cart={finalOrder.cart} cartTotal={finalOrder.cartTotal} orderDetails={finalOrder.details} address={finalOrder.address} onBackToShopping={handleBackToShopping} />;
    }

    return (
        <div className={`bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden min-h-[600px] transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="p-4 sm:p-6 border-b border-rose-100 bg-rose-50/50 flex items-center">
                <button
                    onClick={() => window.history.back()}
                    className="text-rose-700 hover:text-rose-900 hover:underline flex items-center text-sm sm:text-base font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
                </button>
                <h2 className="mx-auto text-xl sm:text-3xl font-serif font-bold text-rose-950 tracking-wide">Secure Checkout</h2>
                <div className="hidden sm:block w-32"></div> {/* Spacer for centering */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-10">
                {/* Left Side: Payment Options */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-rose-950 border-b border-rose-100 pb-3 mb-4 font-serif">Shipping Address</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input type="text" value={address.fullName} onChange={(e) => handleAddressChange('fullName', e.target.value)} placeholder="John Doe" className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.fullName ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`} />
                                {errors.fullName && <p className="text-rose-600 text-xs mt-1">{errors.fullName}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                                <input type="tel" value={address.phone} onChange={(e) => handleAddressChange('phone', e.target.value.replace(/\D/g, '').substring(0, 10))} placeholder="9876543210" className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.phone ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`} />
                                {errors.phone && <p className="text-rose-600 text-xs mt-1">{errors.phone}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 1 *</label>
                                <input type="text" value={address.line1} onChange={(e) => handleAddressChange('line1', e.target.value)} placeholder="123, Main Street" className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.line1 ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`} />
                                {errors.line1 && <p className="text-rose-600 text-xs mt-1">{errors.line1}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 2</label>
                                <input type="text" value={address.line2} onChange={(e) => handleAddressChange('line2', e.target.value)} placeholder="Near Landmark (optional)" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                                <input type="text" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} placeholder="Jaipur" className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.city ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`} />
                                {errors.city && <p className="text-rose-600 text-xs mt-1">{errors.city}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                                <input type="text" value={address.state} onChange={(e) => handleAddressChange('state', e.target.value)} placeholder="Rajasthan" className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.state ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`} />
                                {errors.state && <p className="text-rose-600 text-xs mt-1">{errors.state}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                                <input type="text" value={address.pincode} onChange={(e) => handleAddressChange('pincode', e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="302001" className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.pincode ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`} />
                                {errors.pincode && <p className="text-rose-600 text-xs mt-1">{errors.pincode}</p>}
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-rose-950 border-b border-rose-100 pb-3 font-serif">Select Payment Method</h3>

                    <div className="flex flex-col gap-4">
                        {/* UPI */}
                        <div className={`border-2 rounded-xl p-4 sm:p-6 transition-all ${paymentMethod === 'upi' ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-gray-200 hover:border-amber-300 cursor-pointer'}`} onClick={() => setPaymentMethod('upi')}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="w-5 h-5 text-amber-500 accent-amber-500" />
                                <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-amber-500' : 'text-gray-400'}`} />
                                <span className={`font-bold text-lg ${paymentMethod === 'upi' ? 'text-rose-950' : 'text-gray-700'}`}>UPI (GPay, PhonePe, Paytm)</span>
                            </div>
                            {paymentMethod === 'upi' && (
                                <div className="mt-5 sm:ml-9 p-5 bg-white rounded-xl border border-amber-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">UPI ID</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            placeholder="Enter UPI ID (e.g., username@upi)"
                                            className={`w-full flex-1 px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${upiIdVerified === false || errors.upi ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                                            value={upiId}
                                            onChange={(e) => {
                                                setUpiId(e.target.value);
                                                setUpiIdVerified(null);
                                                if (errors.upi) setErrors({ ...errors, upi: null });
                                            }}
                                        />
                                        <button
                                            onClick={handleUpiVerification}
                                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-rose-950 font-bold py-2.5 px-6 rounded-lg transition-all shadow-sm transform hover:scale-105 whitespace-nowrap"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    {upiIdVerified === true && (
                                        <div className="flex items-center gap-2 mt-3 p-2.5 bg-green-50 border border-green-200 rounded-md shadow-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <p className="text-green-800 text-sm font-medium">UPI ID Verified Successfully!</p>
                                        </div>
                                    )}
                                    {upiIdVerified === false && (
                                        <div className="flex items-center gap-2 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                            <p className="text-rose-800 text-sm font-medium">Invalid UPI ID. Please check and try again.</p>
                                        </div>
                                    )}
                                    {errors.upi && upiIdVerified !== false && (
                                        <div className="flex items-start gap-2 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-rose-800 text-sm font-medium leading-tight">{errors.upi}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Credit/Debit Card */}
                        <div className={`border-2 rounded-xl p-4 sm:p-6 transition-all ${paymentMethod === 'card' ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-gray-200 hover:border-amber-300 cursor-pointer'}`} onClick={() => setPaymentMethod('card')}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 text-amber-500 accent-amber-500" />
                                <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-amber-500' : 'text-gray-400'}`} />
                                <span className={`font-bold text-lg ${paymentMethod === 'card' ? 'text-rose-950' : 'text-gray-700'}`}>Credit / Debit Card</span>
                            </div>
                            {paymentMethod === 'card' && (
                                <div className="mt-5 sm:ml-9 p-5 bg-white rounded-xl border border-amber-200 shadow-sm space-y-5" onClick={(e) => e.stopPropagation()}>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.cardNumber ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                        />
                                        {errors.cardNumber && (
                                            <div className="flex items-start gap-2 mt-2 p-2 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-rose-800 text-xs font-medium leading-tight">{errors.cardNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="w-full sm:w-1/2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.cardExpiry ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                                                value={cardExpiry}
                                                onChange={handleCardExpiryChange}
                                            />
                                            {errors.cardExpiry && (
                                                <div className="flex items-start gap-2 mt-2 p-2 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                                                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-rose-800 text-xs font-medium leading-tight">{errors.cardExpiry}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full sm:w-1/2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVV</label>
                                            <input
                                                type="password"
                                                placeholder="123"
                                                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.cardCvv ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                                                value={cardCvv}
                                                onChange={handleCardCvvChange}
                                            />
                                            {errors.cardCvv && (
                                                <div className="flex items-start gap-2 mt-2 p-2 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                                                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-rose-800 text-xs font-medium leading-tight">{errors.cardCvv}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cash on Delivery */}
                        <label className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-gray-200 hover:border-amber-300'}`}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-amber-500 accent-amber-500" />
                                <Banknote className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-amber-500' : 'text-gray-400'}`} />
                                <span className={`font-bold text-lg ${paymentMethod === 'cod' ? 'text-rose-950' : 'text-gray-700'}`}>Cash on Delivery</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className="bg-gradient-to-b from-rose-50 to-[#faf6f0] p-6 lg:p-8 rounded-2xl border border-amber-200 h-fit sticky top-24 shadow-lg">
                    <h3 className="text-2xl font-bold text-rose-950 border-b border-rose-200 pb-4 mb-4 font-serif">Order Summary</h3>

                    {cart.length === 0 ? (
                        <p className="text-rose-800 italic mb-4">Your bag is empty.</p>
                    ) : (
                        <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map(item => (
                                <div key={`${item.id}-${item.size}`} className="flex justify-between items-center text-sm">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-14 h-16 bg-white border border-rose-200 rounded overflow-hidden flex-shrink-0 shadow-sm">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-rose-950 line-clamp-1">{item.name}</p>
                                            <p className="text-rose-700">Qty: {item.qty} {item.size && `| Size: ${item.size}`}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-rose-950">{formatINR(item.price * item.qty)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-rose-200 pt-5 flex flex-col gap-3 text-sm">
                        <div className="flex justify-between text-rose-800">
                            <span>Items Total</span>
                            <span>{formatINR(cartTotal)}</span>
                        </div>
                        <div className="flex justify-between text-rose-800">
                            <span>Delivery Fee</span>
                            <span className="text-green-600 font-bold">FREE</span>
                        </div>
                        <div className="flex justify-between text-xl font-serif font-bold text-rose-950 mt-2 pt-4 border-t border-rose-200">
                            <span>Amount to Pay</span>
                            <span className="text-amber-600">{formatINR(cartTotal)}</span>
                        </div>
                    </div>

                    <button
                        disabled={isPlaceOrderDisabled()}
                        className={`w-full mt-8 py-4 rounded-xl transition-all shadow-xl text-lg uppercase tracking-widest font-bold ${isPlaceOrderDisabled() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 text-amber-400 transform hover:-translate-y-0.5 border border-rose-900'}`}
                        onClick={handlePlaceOrder}
                    >
                        {orderPlaced ? 'Placing Order...' : 'Place Order'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-4">
                        By placing this order, you agree to our <Link to="/terms" className="text-amber-600 hover:underline" target="_blank">Terms of Use and Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Checkout;