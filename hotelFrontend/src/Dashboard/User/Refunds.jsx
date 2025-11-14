import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bookingService } from '../../services/bookingService';

export default function UserRefunds() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const res = await bookingService.getBookings();
      const data = Array.isArray(res) ? res : (res?.data || []);
      // Keep only bookings that have refund info or are cancelled
      const refunds = data.filter(b => (b.refundAmount && b.refundAmount > 0) || (b.status && b.status.toLowerCase() === 'cancelled'));
      setBookings(refunds);
    } catch (err) {
      console.error('Failed to load refunds', err);
    } finally {
      setLoading(false);
    }
  })(); }, []);

  return (
    <Layout role="user" title="Hello, User" subtitle="Refunds">
     
        <div className="font-semibold mb-4 text-lg">Your Refunds</div>
        {loading ? (
          <div className="text-gray-500">Loading refunds...</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500">No refunds available.</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {bookings.map(b => (
                <div key={b._id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500">Hotel:</span>
                      <div className="font-medium text-sm">{b.hotel?.name || '-'}</div>
                    </div>
                    {b.refundAmount > 0 ? (
                      <span className={`inline-block text-xs px-2 py-1 rounded ${
                        b.refundStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {(b.refundStatus || 'pending').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">{(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1) || '-'}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">Check-in:</span>
                      <div className="text-sm">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Refund Amount:</span>
                      <div className="text-sm font-semibold text-blue-600">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</div>
                    </div>
                    {b.cancelledAt && (
                      <div>
                        <span className="text-xs text-gray-500">Cancelled:</span>
                        <div className="text-sm">{new Date(b.cancelledAt).toLocaleDateString()}</div>
                      </div>
                    )}
                    {b.refundedAt && (
                      <div>
                        <span className="text-xs text-gray-500">Refunded:</span>
                        <div className="text-sm">{new Date(b.refundedAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Hotel</th>
                    <th className="py-2">Check-in</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Refund Amount</th>
                    <th className="py-2">Cancelled On</th>
                    <th className="py-2">Refunded On</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b">
                      <td className="py-2">{b.hotel?.name || '-'}</td>
                      <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleString() : '-'}</td>
                      <td className="py-2">
                        {b.refundAmount > 0 ? (
                          <span className={`inline-block text-xs px-2 py-1 rounded ${b.refundStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {(b.refundStatus || 'pending').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">{(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1) || '-'}</span>
                        )}
                      </td>
                      <td className="py-2">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</td>
                      <td className="py-2">{b.cancelledAt ? new Date(b.cancelledAt).toLocaleString() : '-'}</td>
                      <td className="py-2">{b.refundedAt ? new Date(b.refundedAt).toLocaleString() : '-'}</td>
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
