import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useUser } from '../hooks/useUser';
import { formatINR } from '../utils';
import { executeStrictOrderPipeline, PipelineError } from '../services/securePipeline';
import { Navigate, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Banknote, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import OrderSummary from './OrderSummary';

const STATUS = { IDLE: 'IDLE', RUNNING: 'RUNNING', FAILED: 'FAILED', SUCCESS: 'SUCCESS' };

export default function CheckoutForm() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useUser();

  const [pipelineStatus, setPipelineStatus] = useState(STATUS.IDLE);
  const [pipelineError, setPipelineError] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    location: '',
    addressLine: '',
    addressLine2: '',
    state: '',
    pincode: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (pipelineError) setPipelineError(null);
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
    setCardExpiry(val);
  };

  const handleCardCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    setCardCvv(val.substring(0, 4));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pipelineStatus === STATUS.RUNNING) return;

    setPipelineStatus(STATUS.RUNNING);
    setPipelineError(null);

    const orderPayload = {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || user?.email || '',
      location: formData.location,
      addressLine: formData.addressLine,
      addressLine2: formData.addressLine2,
      state: formData.state,
      pincode: formData.pincode,
      paymentMethod,
      orderNotes,
      cart: cart,
      total: cartTotal,
    };

    try {
      const result = await executeStrictOrderPipeline(orderPayload);

      setFinalResult({ ...result, cart: [...cart], cartTotal, formData, paymentMethod, orderNotes });
      setPipelineStatus(STATUS.SUCCESS);
      clearCart();
      setShowOrderSummary(true);
    } catch (err) {
      setPipelineStatus(STATUS.FAILED);
      if (err instanceof PipelineError) {
        setPipelineError({ code: err.code, message: err.message, layer: err.layer });
      } else {
        setPipelineError({ code: 'UNKNOWN', message: err.message || 'An unexpected error occurred.', layer: 'UNKNOWN' });
      }
    }
  };

  if (!user) {
    return <Navigate to="/signin" state={{ message: 'Please sign in to checkout.' }} replace />;
  }

  if (showOrderSummary && finalResult) {
    return (
      <OrderSummary
        cart={finalResult.cart}
        cartTotal={finalResult.cartTotal}
        orderDetails={{
          id: finalResult.orderId,
          date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          delivery: new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }),
        }}
        address={finalResult.formData}
        onBackToShopping={() => {
          setShowOrderSummary(false);
          setPipelineStatus(STATUS.IDLE);
          setFinalResult(null);
          setFormData({ fullName: '', phone: '', email: '', location: '', addressLine: '', addressLine2: '', state: '', pincode: '' });
          setPaymentMethod('cod');
          setUpiId('');
          setCardNumber('');
          setCardExpiry('');
          setCardCvv('');
          setOrderNotes('');
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden min-h-[600px]">
      <div className="p-4 sm:p-6 border-b border-rose-100 bg-rose-50/50 flex items-center">
        <button
          onClick={() => window.history.back()}
          className="text-rose-700 hover:text-rose-900 hover:underline flex items-center text-sm sm:text-base font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <h2 className="mx-auto text-xl sm:text-3xl font-serif font-bold text-rose-950 tracking-wide">Secure Checkout</h2>
        <div className="hidden sm:block w-32" />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Shipping Information */}
          <div className="bg-white rounded-xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-xl font-bold text-rose-950 border-b border-rose-100 pb-3 mb-4 font-serif">Shipping Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Your full name" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').substring(0, 10))} placeholder="9876543210" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="ganesh@example.com" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 1 *</label>
                <input type="text" value={formData.addressLine} onChange={(e) => handleChange('addressLine', e.target.value)} placeholder="123, Main Street" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 2</label>
                <input type="text" value={formData.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} placeholder="Near landmark (optional)" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City / Location *</label>
                <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Hyderabad" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
                <p className="text-xs text-gray-400 mt-1">Allowed: Hyderabad, Bengaluru, Goa, Mumbai, Delhi</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                <input type="text" value={formData.state} onChange={(e) => handleChange('state', e.target.value)} placeholder="Telangana" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                <input type="text" value={formData.pincode} onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="500001" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" required disabled={pipelineStatus === STATUS.RUNNING} />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-xl font-bold text-rose-950 border-b border-rose-100 pb-3 mb-4 font-serif">Payment Method</h3>
            <div className="flex flex-col gap-4">
              {/* COD */}
              <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-gray-200 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-amber-500 accent-amber-500" />
                  <Banknote className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-amber-500' : 'text-gray-400'}`} />
                  <span className={`font-bold text-lg ${paymentMethod === 'cod' ? 'text-rose-950' : 'text-gray-700'}`}>Cash on Delivery</span>
                </div>
              </label>
              {/* UPI */}
              <div className={`border-2 rounded-xl p-4 transition-all ${paymentMethod === 'upi' ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-gray-200 hover:border-amber-300 cursor-pointer'}`} onClick={() => setPaymentMethod('upi')}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="w-5 h-5 text-amber-500 accent-amber-500" />
                  <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-amber-500' : 'text-gray-400'}`} />
                  <span className={`font-bold text-lg ${paymentMethod === 'upi' ? 'text-rose-950' : 'text-gray-700'}`}>UPI (GPay, PhonePe, Paytm)</span>
                </div>
                {paymentMethod === 'upi' && (
                  <div className="mt-4 sm:ml-9" onClick={(e) => e.stopPropagation()}>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="username@upi" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" disabled={pipelineStatus === STATUS.RUNNING} />
                  </div>
                )}
              </div>
              {/* Card */}
              <div className={`border-2 rounded-xl p-4 transition-all ${paymentMethod === 'card' ? 'border-amber-400 bg-amber-50/30 shadow-md' : 'border-gray-200 hover:border-amber-300 cursor-pointer'}`} onClick={() => setPaymentMethod('card')}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 text-amber-500 accent-amber-500" />
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-amber-500' : 'text-gray-400'}`} />
                  <span className={`font-bold text-lg ${paymentMethod === 'card' ? 'text-rose-950' : 'text-gray-700'}`}>Credit / Debit Card</span>
                </div>
                {paymentMethod === 'card' && (
                  <div className="mt-4 sm:ml-9 space-y-4" onClick={(e) => e.stopPropagation()}>
                    <input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" disabled={pipelineStatus === STATUS.RUNNING} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={cardExpiry} onChange={handleCardExpiryChange} placeholder="MM/YY" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" disabled={pipelineStatus === STATUS.RUNNING} />
                      <input type="password" value={cardCvv} onChange={handleCardCvvChange} placeholder="CVV" maxLength={4} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none" disabled={pipelineStatus === STATUS.RUNNING} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-xl font-bold text-rose-950 border-b border-rose-100 pb-3 mb-4 font-serif">Order Notes</h3>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Any special instructions or delivery preferences?"
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none resize-none"
              disabled={pipelineStatus === STATUS.RUNNING}
            />
          </div>

          {/* Pipeline Messages */}
          {pipelineStatus === STATUS.FAILED && pipelineError && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">{pipelineError.code} — {pipelineError.layer}</p>
                <p className="text-rose-800 text-sm mt-1">{pipelineError.message}</p>
              </div>
            </div>
          )}

          {pipelineStatus === STATUS.SUCCESS && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-900 text-sm">Order Placed Successfully</p>
                <p className="text-green-800 text-sm mt-1">Order ID: {finalResult?.orderId}</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
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
                      <p className="text-rose-700">Qty: {item.qty} {item.size ? `| Size: ${item.size}` : ''}</p>
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
            type="submit"
            disabled={pipelineStatus === STATUS.RUNNING || cart.length === 0}
            className={`w-full mt-8 py-4 rounded-xl transition-all shadow-xl text-lg uppercase tracking-widest font-bold flex items-center justify-center gap-2 ${
              pipelineStatus === STATUS.RUNNING || cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 text-amber-400 transform hover:-translate-y-0.5 border border-rose-900'
            }`}
          >
            {pipelineStatus === STATUS.RUNNING ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : pipelineStatus === STATUS.SUCCESS ? (
              'Order Placed'
            ) : (
              'Place Order'
            )}
          </button>

          {pipelineStatus === STATUS.RUNNING && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <p className="text-amber-800 text-xs font-medium">Pipeline layers: Syntax → Location → Business → Structure → Security → Database</p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            By placing this order, you agree to our{' '}
            <Link to="/terms" className="text-amber-600 hover:underline" target="_blank">Terms of Use</Link>.
          </p>
        </div>
      </form>
    </div>
  );
}
