import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bookingService } from '../../services/bookingService';

export default function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async()=>{
    setLoading(true);
    try {
      const res = await bookingService.getBookings();
      // res could be an array or {data: []}; normalize
      const data = Array.isArray(res) ? res : (res?.data || []);
      setBookings(data);
    } finally { setLoading(false); }
  })(); },[]);

  return (
    <Layout role="user" title="Hello, User" subtitle="Bookings">
      
        <div className="font-semibold mb-4 text-lg">Your Bookings</div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500">No bookings yet.</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {bookings.map(b => (
                <div key={b._id} className="border rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Hotel:</span>
                    <div className="font-medium text-sm">{b.hotel?.name || '-'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">Check-in:</span>
                      <div className="text-sm">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Days:</span>
                      <div className="text-sm">{b.days}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Total:</span>
                      <div className="text-sm font-semibold">${b.totalPrice}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Status:</span>
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b"><th className="py-2">Hotel</th><th className="py-2">Check-in</th><th className="py-2">Days</th><th className="py-2">Total</th><th className="py-2">Status</th></tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b">
                      <td className="py-2">{b.hotel?.name || '-'}</td>
                      <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2">{b.days}</td>
                      <td className="py-2">${b.totalPrice}</td>
                      <td className="py-2">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
     
    </Layout>
  );
}
