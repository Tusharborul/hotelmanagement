import React, { useEffect, useState } from "react";
import Layout from "./components/Layout";
import { showToast } from '../utils/toast';
import { bookingService } from "../services/bookingService";

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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="font-semibold mb-4">Booking List</div>
        {loading ? (
          <div className="text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500">You have no bookings yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => {
              const start = getBookingStart(b);
              const end = getBookingEnd(b);
              const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
              const cancelledAt = b.cancelledAt ? new Date(b.cancelledAt) : null;
              const cardClasses = `border rounded-lg p-4 flex flex-col gap-2 shadow-sm ${isCancelled ? 'bg-gray-50 opacity-80' : 'bg-white'}`;

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
                        <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                          {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : 'Active'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">Booked on: {b.createdAt ? new Date(b.createdAt).toLocaleString() : (b.date ? new Date(b.date).toLocaleString() : '-')}</div>
                  <div className="text-sm">Check-in: {start ? start.toLocaleString() : (b.startDate || '-')}</div>
                  <div className="text-sm">Check-out: {end ? end.toLocaleString() : (b.endDate || '-')}</div>
                  <div className="text-sm text-gray-700">{b.nights ? `${b.nights} Days` : ''}</div>
                  <div className="text-sm text-gray-700">{b.hotel?.address || b.address || ''}</div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm">Initial Payment {b.initialPayment ? `$${b.initialPayment}` : '-'}</div>
                    <div className="text-sm">Total Payment {b.totalPrice ? `$${b.totalPrice}` : '-'}</div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3">
                    {isCancelled ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-gray-500">{cancelledAt ? `Cancelled on ${cancelledAt.toLocaleString()}` : 'Cancelled'}</div>
                        {b.cancelledBy && b.cancelledBy.name ? (
                          <div className="text-xs text-gray-500">Cancelled by: {b.cancelledBy.name}</div>
                        ) : null}
                        {b.refundAmount > 0 ? (
                          <div className="text-xs text-right">
                            <span className="font-semibold">Refund:</span>{' '}{'$' + (Number(b.refundAmount || 0).toFixed(2))}
                            <span className="ml-2 inline-block text-xs px-2 py-1 rounded text-white" style={{backgroundColor: b.refundStatus === 'pending' ? '#f59e0b' : '#16a34a'}}>
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
                          className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
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
