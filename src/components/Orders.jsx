import React from 'react';
import { useStore } from '../store/useStore';
import { formatINR } from '../utils';
import { useFadeIn } from '../hooks/useFadeIn';
import { ShoppingBag } from 'lucide-react';

const Orders = () => {
  const isVisible = useFadeIn();
  const orders = useStore((state) => state.orders);

  return (
    <div className={`bg-white rounded-xl shadow-md border border-rose-100 overflow-hidden min-h-[400px] transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="p-4 border-b border-rose-100 bg-rose-50/50">
        <h2 className="mx-auto text-2xl font-serif font-bold text-rose-950">Your Orders</h2>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-rose-300" />
          </div>
          <p className="text-xl font-semibold text-gray-500 mb-2">No orders yet</p>
          <p className="text-gray-400 mb-8">Place your first order to see it here!</p>
        </div>
      ) : (
        <div className="p-6 lg:p-10 flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">Date: {order.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${order.status === 'Delivered' ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.status}
                  </p>
                  <p className="text-lg font-bold">{formatINR(order.total)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {order.items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-md" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.qty} {item.size ? `| Size: ${item.size}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
