import React from 'react';
import { ORDERS } from '../data/orders';
import { formatINR } from '../utils';
import { useFadeIn } from '../hooks/useFadeIn';

const Orders = () => {
  const isVisible = useFadeIn();

  return (
    <div className={`bg-white rounded-xl shadow-md border border-rose-100 overflow-hidden min-h-[600px] transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="p-4 border-b border-rose-100 bg-rose-50/50">
        <h2 className="mx-auto text-2xl font-serif font-bold text-rose-950">Your Orders</h2>
      </div>
      <div className="p-6 lg:p-10 flex flex-col gap-8">
        {ORDERS.map((order) => (
          <div key={order.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-lg">Order #{order.id}</p>
                <p className="text-sm text-gray-500">Date: {order.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${order.status === 'Delivered' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.status}
                </p>
                <p className="text-lg font-bold">{formatINR(order.total)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-md" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
