import React, { useEffect, useState, useMemo } from "react";
import Layout from "./components/Layout";
import Spinner from "../components/Spinner";
import { showToast } from '../utils/toast';
import { bookingService } from "../services/bookingService";
import { formatDateTime } from '../utils/date';

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingIds, setCancelingIds] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchBookings = async () => {
      try {
        const res = await bookingService.getBookings();
        const list = res && Array.isArray(res) ? res : (res?.data || res?.bookings || []);
        if (mounted) setBookings(list);
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBookings();
    return () => { mounted = false; };
  }, []);

  // Helper: extract booking start/check-in time from known fields
  const getBookingStart = (b) => {
    // common field names: startDate, checkIn, checkInDate, arrivalDate
    const val = b?.startDate || b?.checkIn || b?.checkInDate || b?.arrivalDate || b?.start;
    if (!val) return null;
    const t = new Date(val);
    return Number.isNaN(t.getTime()) ? null : t;
  };

  // Helper: extract booking end/check-out time from known fields
  const getBookingEnd = (b) => {
    // common field names: endDate, checkOut, checkOutDate, departureDate
    const val = b?.endDate || b?.checkOut || b?.checkOutDate || b?.departureDate || b?.end;
    if (!val) return null;
    const t = new Date(val);
    return Number.isNaN(t.getTime()) ? null : t;
  };

  // Sort: upcoming first (earliest first), prioritize confirmed; then past (latest first)
  const sortedBookings = useMemo(() => {
    const now = Date.now();
    return [...bookings].sort((a, b) => {
      const statusA = (a.status || '').toLowerCase();
      const statusB = (b.status || '').toLowerCase();
      const cancelledA = statusA === 'cancelled';
      const cancelledB = statusB === 'cancelled';
      // Cancelled always at end
      if (cancelledA && !cancelledB) return 1;
      if (!cancelledA && cancelledB) return -1;

      const startA = getBookingStart(a);
      const startB = getBookingStart(b);
      const tA = startA ? startA.getTime() : null;
      const tB = startB ? startB.getTime() : null;
      const upcomingA = tA !== null && tA >= now;
      const upcomingB = tB !== null && tB >= now;

      // Non-cancelled: upcoming first
      if (!cancelledA && !cancelledB) {
        if (upcomingA !== upcomingB) return upcomingA ? -1 : 1;
        const confirmedA = statusA === 'confirmed';
        const confirmedB = statusB === 'confirmed';
        if (confirmedA !== confirmedB) return confirmedA ? -1 : 1;
        if (tA !== tB) {
          if (upcomingA) return (tA ?? Infinity) - (tB ?? Infinity); // upcoming earlier first
          return (tB ?? -Infinity) - (tA ?? -Infinity); // past newer first
        }
        return 0;
      }
      // Both cancelled: order by cancelledAt newest first; fallback to start time newest first
      const cancelledAtA = a.cancelledAt ? new Date(a.cancelledAt).getTime() : null;
      const cancelledAtB = b.cancelledAt ? new Date(b.cancelledAt).getTime() : null;
      if (cancelledAtA !== cancelledAtB) return (cancelledAtB ?? -Infinity) - (cancelledAtA ?? -Infinity);
      if (tA !== tB) return (tB ?? -Infinity) - (tA ?? -Infinity);
      return 0;
    });
  }, [bookings]);

  // Helper: determine if a booking can be cancelled (must be > 24 hours before check-in)
  const isCancelable = (b) => {
    const start = getBookingStart(b);
    if (!start) return false;
    const now = Date.now();
    const ms24 = 24 * 60 * 60 * 1000;
    return start.getTime() - now > ms24;
  };

  const handleCancel = async (id) => {
    if (!id) return;
    // optimistic UI: mark as cancelling
    setCancelingIds((s) => [...s, id]);
    try {
      const res = await bookingService.cancelBooking(id);
      // prefer server-returned booking if provided
      const updated = res?.data || res;
      if (updated && (updated._id || updated.id)) {
        setBookings((prev) => prev.map((b) => ((b._id || b.id) === (updated._id || updated.id) ? updated : b)));
      } else {
        // fallback: mark as cancelled
        setBookings((prev) => prev.map((b) => {
          const bid = b._id || b.id;
          if (bid === id) {
            return { ...b, status: 'cancelled' };
          }
          return b;
        }));
      }
    } catch (err) {
      console.error('Failed to cancel booking', err);
      // show server message when available
  const msg = err?.response?.data?.message || 'Failed to cancel booking. Please try again.';
  showToast(msg, 'error');
    } finally {
      setCancelingIds((s) => s.filter((x) => x !== id));
    }
  };

  return (
    <Layout role="user" title="Hello, User" subtitle="John Wick">
      <div>
        <div className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Your Bookings</div>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading bookings..." /></div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500 text-center py-8">You have no bookings yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sortedBookings.map((b) => {
              const start = getBookingStart(b);
              const end = getBookingEnd(b);
              const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
              const cancelledAt = b.cancelledAt ? new Date(b.cancelledAt) : null;
              const cardClasses = `border-2 rounded-2xl p-6 flex flex-col gap-3 shadow-lg transform transition-all duration-300 ${
                isCancelled 
                  ? 'bg-gray-50 border-gray-300 opacity-80' 
                  : 'bg-white border-blue-100 hover:border-blue-400 hover:shadow-2xl hover:scale-105 cursor-pointer'
              }`;

              return (
                <div key={b._id || b.id} className={cardClasses}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-blue-600">{b.price ? `$${b.price} per night` : (b.totalPrice ? `$${b.totalPrice}` : '-')}</div>
                      <div className="font-bold text-lg">{b.hotel?.name || b.hotelName || b.title || 'Unknown Hotel'}</div>
                      <div className="text-gray-500 text-sm">{b.hotel?.location || b.location || ''}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {isCancelled ? (
                        <span className="inline-block bg-linear-to-r from-red-400 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-block bg-linear-to-r from-green-400 to-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                          {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : 'Active'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">Booked on: {b.createdAt ? formatDateTime(b.createdAt) : (b.date ? formatDateTime(b.date) : '-')}</div>
                  <div className="text-sm">Check-in: {start ? formatDateTime(start) : (b.startDate ? formatDateTime(b.startDate) : '-')}</div>
                  <div className="text-sm">Check-out: {end ? formatDateTime(end) : (b.endDate ? formatDateTime(b.endDate) : '-')}</div>
                  <div className="text-sm text-gray-700">{b.nights ? `${b.nights} Days` : ''}</div>
                  <div className="text-sm text-gray-700">{b.hotel?.address || b.address || ''}</div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm">Initial Payment {b.initialPayment ? `$${b.initialPayment}` : '-'}</div>
                    <div className="text-sm">Total Payment {b.totalPrice ? `$${b.totalPrice}` : '-'}</div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3">
                    {isCancelled ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-gray-500">{cancelledAt ? `Cancelled on ${formatDateTime(cancelledAt)}` : 'Cancelled'}</div>
                        {b.cancelledBy && b.cancelledBy.name ? (
                          <div className="text-xs text-gray-500">Cancelled by: {b.cancelledBy.name}</div>
                        ) : null}
                        {b.refundAmount > 0 ? (
                          <div className="text-xs text-right">
                            <span className="font-semibold">Refund:</span>{' '}{'$' + (Number(b.refundAmount || 0).toFixed(2))}
                            <span className={`ml-2 inline-block text-xs px-3 py-1 rounded-lg font-semibold shadow-sm ${
                              b.refundStatus === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-linear-to-r from-green-400 to-green-500 text-white'
                            }`}>
                              {(b.refundStatus || '').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">No refund due</div>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          className="bg-linear-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg"
                          onClick={() => {
                            const id = b._id || b.id;
                            if (!isCancelable(b)) {
                              showToast('Bookings can only be cancelled at least 24 hours before check-in.', 'warning');
                              return;
                            }
                            (async ()=>{
                              const { confirmAsync } = await import('../utils/confirm');
                              if (await confirmAsync('Are you sure you want to cancel this booking?')) {
                                handleCancel(id);
                              }
                            })();
                          }}
                          disabled={!isCancelable(b) || cancelingIds.includes(b._id || b.id)}
                        >
                          {cancelingIds.includes(b._id || b.id) ? 'Cancelling...' : (isCancelable(b) ? 'Cancel booking' : 'Cannot cancel')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
