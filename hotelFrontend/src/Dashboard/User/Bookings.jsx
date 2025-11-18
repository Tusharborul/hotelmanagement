import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bookingService } from '../../services/bookingService';
import { formatDateTime } from '../../utils/date';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';

export default function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(()=>{ (async()=>{
    setLoading(true);
    try {
      const res = await bookingService.getBookings();
      // res could be an array or {data: []}; normalize
      const data = Array.isArray(res) ? res : (res?.data || []);
      const now = Date.now();
      const sorted = [...data].sort((a, b) => {
        const statusA = (a.status || '').toLowerCase();
        const statusB = (b.status || '').toLowerCase();
        const isCancelledA = statusA === 'cancelled';
        const isCancelledB = statusB === 'cancelled';
        // Cancelled bookings always go to the end
        if (isCancelledA && !isCancelledB) return 1;
        if (!isCancelledA && isCancelledB) return -1;

        const timeA = a.checkInDate ? new Date(a.checkInDate).getTime() : null;
        const timeB = b.checkInDate ? new Date(b.checkInDate).getTime() : null;
        const upcomingA = timeA !== null && timeA >= now;
        const upcomingB = timeB !== null && timeB >= now;
        // Among non-cancelled: upcoming first
        if (!isCancelledA && !isCancelledB) {
          if (upcomingA !== upcomingB) return upcomingA ? -1 : 1;
          const confirmedA = statusA === 'confirmed';
            const confirmedB = statusB === 'confirmed';
            if (confirmedA !== confirmedB) return confirmedA ? -1 : 1;
          // If both upcoming: earlier first; if both past: later first
          if (timeA !== timeB) {
            if (upcomingA) return (timeA ?? Infinity) - (timeB ?? Infinity);
            return (timeB ?? -Infinity) - (timeA ?? -Infinity);
          }
          return 0;
        }
        // Both cancelled: order by cancelledAt newest first, fallback to checkInDate newest first
        const cancelledAtA = a.cancelledAt ? new Date(a.cancelledAt).getTime() : null;
        const cancelledAtB = b.cancelledAt ? new Date(b.cancelledAt).getTime() : null;
        if (cancelledAtA !== cancelledAtB) return (cancelledAtB ?? -Infinity) - (cancelledAtA ?? -Infinity);
        if (timeA !== timeB) return (timeB ?? -Infinity) - (timeA ?? -Infinity);
        return 0;
      });
      setAllBookings(sorted);
      setTotal(sorted.length);
      setPage(1);
      setBookings(sorted.slice(0, limit));
    } finally { setLoading(false); }
  })(); },[]);

  const goPage = (p) => {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const target = Math.min(Math.max(1, p), totalPages);
    const start = (target - 1) * limit;
    setBookings(allBookings.slice(start, start + limit));
    setPage(target);
  };

  return (
    <Layout role="user" title="Hello, User" subtitle="Bookings">
        <div className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Your Bookings</div>
      
        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading bookings..." /></div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No bookings yet.</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {bookings.map(b => (
                <div key={b._id} className="border-2 border-blue-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  <div>
                    <span className="text-xs text-gray-500">Hotel:</span>
                    <div className="font-medium text-sm">{b.hotel?.name || '-'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">Check-in:</span>
                      <div className="text-sm">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</div>
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
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
                          b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                          b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                          'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                        }`}>
                          {(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1) || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-linear-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200"><th className="py-4 px-6 font-semibold text-gray-700">Hotel</th><th className="py-4 px-6 font-semibold text-gray-700">Check-in</th><th className="py-4 px-6 font-semibold text-gray-700">Days</th><th className="py-4 px-6 font-semibold text-gray-700">Total</th><th className="py-4 px-6 font-semibold text-gray-700">Status</th></tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-medium text-gray-800">{b.hotel?.name || '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.days}</td>
                      <td className="py-4 px-6 font-semibold text-green-600">${b.totalPrice}</td>
                      <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                        b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                        b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                        'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                      }`}>
                        {(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1) || '-'}
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <Pagination page={page} total={total} limit={limit} onPageChange={goPage} className="mt-6" />
     
    </Layout>
  );
}
