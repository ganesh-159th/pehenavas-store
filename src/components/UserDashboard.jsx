import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import { Navigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { formatINR } from '../utils';
import { ShoppingBag, Clock, Loader2, Gift, MailCheck, RefreshCw } from 'lucide-react';
import { showAlert } from '../utils/alert';

export default function UserDashboard() {
  const { user, resendVerification, refreshUser } = useUser();
  const [verifying, setVerifying] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, 'users', user.uid, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));
        setOrders(fetched);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const recommendedItems = useMemo(() => {
    const itemMap = new Map();
    for (const order of orders) {
      const items = order.itemsPurchased || [];
      for (const item of items) {
        if (!itemMap.has(item.productId)) {
          itemMap.set(item.productId, {
            id: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            orderCount: 1,
          });
        } else {
          itemMap.get(item.productId).orderCount += 1;
        }
      }
    }
    return Array.from(itemMap.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 6);
  }, [orders]);

  if (!user) {
    return <Navigate to="/signin" state={{ message: 'Please sign in to view your account.' }} replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-10 text-center">
        <p className="text-rose-600 font-bold mb-2">Could not load your data</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-rose-950 to-rose-900 rounded-2xl shadow-xl p-6 sm:p-10 text-white">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-wide">
          Welcome, {user.name}
        </h1>
        <p className="text-rose-200 mt-2 text-sm flex items-center gap-2 flex-wrap">
          {user.email}
          {user.emailVerified ? (
            <span className="text-green-400 text-xs">(Verified)</span>
          ) : (
            <>
              <span className="text-amber-400 text-xs">(Not Verified)</span>
              <button
                onClick={async () => {
                  setVerifying(true);
                  try {
                    await resendVerification();
                    showAlert('Verification email sent! Check your inbox (including spam).', 'success');
                  } catch {
                    showAlert('Failed to send. Try again later.', 'danger');
                  }
                  setVerifying(false);
                }}
                disabled={verifying}
                className="inline-flex items-center gap-1 text-xs bg-amber-500 text-rose-950 px-3 py-1 rounded-full font-bold hover:bg-amber-400 transition disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <MailCheck className="w-3 h-3" />}
                Verify Email
              </button>
              <button
                onClick={async () => {
                  try {
                    await refreshUser();
                    if (user.emailVerified) {
                      showAlert('Email verified!', 'success');
                    } else {
                      showAlert('Status checked. Email still not verified.', 'info');
                    }
                  } catch {
                    showAlert('Could not refresh status.', 'danger');
                  }
                }}
                className="inline-flex items-center gap-1 text-xs bg-rose-700 text-rose-200 px-3 py-1 rounded-full font-bold hover:bg-rose-600 transition"
              >
                <RefreshCw className="w-3 h-3" />Refresh
              </button>
            </>
          )}
        </p>
        <p className="text-amber-400 text-sm mt-1">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-10 sm:p-16 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-rose-300" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-rose-950 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-8">Place your first order to see it here.</p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-rose-950 to-rose-900 text-amber-400 px-8 py-3 rounded-xl font-bold hover:from-rose-900 hover:to-rose-800 transition-all shadow-lg"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-rose-100 bg-rose-50/50">
              <h2 className="text-2xl font-serif font-bold text-rose-950 flex items-center gap-2">
                <Clock className="w-6 h-6 text-amber-500" />
                Order History
              </h2>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order.firestoreId} className="border border-rose-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 font-mono">ID: {order.firestoreId}</p>
                      <p className="text-lg font-bold text-rose-950">
                        {formatINR(order.financialSummary?.total || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {order.fulfillmentStatus || 'pending'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(order.itemsPurchased || []).map((item) => (
                      <div key={`${item.productId}-${item.size}`} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-12 object-cover rounded border border-gray-200 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-rose-950 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {recommendedItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-rose-100 bg-rose-50/50">
                <h2 className="text-2xl font-serif font-bold text-rose-950 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-amber-500" />
                  Recommended for You
                </h2>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {recommendedItems.map((item) => (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-2 shadow-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-rose-950 truncate group-hover:text-amber-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs font-bold text-amber-600">{formatINR(item.price)}</p>
                      {item.orderCount > 1 && (
                        <p className="text-[10px] text-gray-400">Ordered {item.orderCount}x</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
