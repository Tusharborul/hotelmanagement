import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bookingService } from '../../services/bookingService';
import { formatDateTime } from '../../utils/date';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatINR } from '../../utils/currency';

export default function UserRefunds() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allRefunds, setAllRefunds] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const res = await bookingService.getBookings();
      const data = Array.isArray(res) ? res : (res?.data || []);
      // Keep only bookings that have refund info or are cancelled
      let refunds = data.filter(b => (b.refundAmount && b.refundAmount > 0) || (b.status && b.status.toLowerCase() === 'cancelled'));
      // Sort: pending/issued first, then by most recent
      refunds = refunds.sort((a, b) => {
        const statusA = (a.refundStatus || 'none').toLowerCase();
        const statusB = (b.refundStatus || 'none').toLowerCase();
        if (statusA === 'pending' && statusB !== 'pending') return -1;
        if (statusA !== 'pending' && statusB === 'pending') return 1;
        if (statusA === 'issued' && statusB !== 'issued' && statusB !== 'pending') return -1;
        if (statusA !== 'issued' && statusB === 'issued' && statusA !== 'pending') return 1;
        const timeA = a.cancelledAt ? new Date(a.cancelledAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.cancelledAt ? new Date(b.cancelledAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setAllRefunds(refunds);
      setTotal(refunds.length);
      setPage(1);
      setBookings(refunds.slice(0, limit));
    } catch (err) {
      console.error('Failed to load refunds', err);
    } finally {
      setLoading(false);
    }
  })(); }, []);

  const goPage = (p) => {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const target = Math.min(Math.max(1, p), totalPages);
    const start = (target - 1) * limit;
    setBookings(allRefunds.slice(start, start + limit));
    setPage(target);
  };

  return (
    <Layout role="user" title="Hello, User" subtitle="Refunds">
        <div className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Your Refunds</div>
     
        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading refunds..." /></div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No refunds available.</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {bookings.map(b => (
                <div key={b._id} className="border-2 border-purple-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-purple-300 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500">Hotel:</span>
                      <div className="font-medium text-sm">{b.hotel?.name || '-'}</div>
                    </div>
                    {b.refundAmount > 0 ? (
                      <span className={`inline-block text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
                        b.refundStatus === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' : 
                        'bg-linear-to-r from-green-400 to-green-500 text-white'
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
                      <div className="text-sm">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Refund Amount:</span>
                      <div className="text-sm font-semibold text-purple-600">{b.refundAmount ? formatINR(Number(b.refundAmount)) : '-'}</div>
                    </div>
                    {b.cancelledAt && (
                      <div>
                        <span className="text-xs text-gray-500">Cancelled:</span>
                        <div className="text-sm">{formatDateTime(b.cancelledAt)}</div>
                      </div>
                    )}
                    {b.refundedAt && (
                      <div>
                        <span className="text-xs text-gray-500">Refunded:</span>
                        <div className="text-sm">{formatDateTime(b.refundedAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg">
              {/* Header table */}
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="bg-linear-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                    <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Refund Amount</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Cancelled On</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Refunded On</th>
                  </tr>
                </thead>
              </table>

              {/* Scrollable body */}
              <div className="max-h-[55vh] overflow-auto scrollbar-custom">
                <table className="w-full table-fixed">
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors duration-200">
                        <td className="py-4 px-6 font-medium text-gray-800">{b.hotel?.name || '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                        <td className="py-4 px-6">
                          {b.refundAmount > 0 ? (
                            <span className={`inline-block text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${b.refundStatus === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-linear-to-r from-green-400 to-green-500 text-white'}`}>
                              {(b.refundStatus || 'pending').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">{(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1) || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-purple-600">{b.refundAmount ? formatINR(Number(b.refundAmount)) : '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{b.cancelledAt ? formatDateTime(b.cancelledAt) : '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{b.refundedAt ? formatDateTime(b.refundedAt) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <Pagination page={page} total={total} limit={limit} onPageChange={goPage} className="mt-6" />
    
    </Layout>
  );
}
