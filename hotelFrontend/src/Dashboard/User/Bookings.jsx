import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { bookingService } from '../../services/bookingService';
import { formatDateTime } from '../../utils/date';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatINR } from '../../utils/currency';

const EyeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <circle cx="12" cy="12" r="3" strokeWidth="2" />
  </svg>
);

export default function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(()=>{ (async()=>{
    setLoading(true);
    try {
      const res = await bookingService.getBookings();
      // res could be an array or {data: []}; normalize
      const data = Array.isArray(res) ? res : (res?.data || []);
      const now = Date.now();
      const sorted = [...data].sort((a, b) => {
        const ca = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
        const cb = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
        return (cb ?? -Infinity) - (ca ?? -Infinity); // last created first
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

  const closeModal = () => setActiveBooking(null);
  const downloadTicket = () => {
    if (!activeBooking) return;
    // Render a simple JPG via canvas
    const canvas = document.createElement('canvas');
    const width = 960; const height = 540; // 16:9 card
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    // Header gradient
    const grad = ctx.createLinearGradient(0,0,width,0);
    grad.addColorStop(0, '#3b82f6'); // blue-500
    grad.addColorStop(1, '#06b6d4'); // cyan-500
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 72);
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, Arial';
    ctx.fillText('IndiaStay Booking Ticket', 24, 44);
    // Content
    const hotelName = activeBooking.hotel?.name || '-';
    const hotelLoc = activeBooking.hotel?.location || '-';
    const checkIn = activeBooking.checkInDate ? formatDateTime(activeBooking.checkInDate) : '-';
    const checkOut = activeBooking.checkOutDate ? formatDateTime(activeBooking.checkOutDate) : '-';
    const createdAt = activeBooking.createdAt ? formatDateTime(activeBooking.createdAt) : '-';
    const daysVal = activeBooking.days ?? '-';
    const roomStr = `${activeBooking.roomNumber ?   activeBooking.roomNumber : '-'}` + `${activeBooking.roomType ? ' (' + activeBooking.roomType + ')' : ''}`;
    const totalStr = activeBooking.totalPrice ? formatINR(activeBooking.totalPrice) : '-';
    const initStr = activeBooking.initialPayment ? formatINR(activeBooking.initialPayment) : '-';
    const trxId = activeBooking.paymentDetails?.stripeChargeId || activeBooking.paymentDetails?.stripePaymentIntentId || '-';
    const customerName = activeBooking.user?.name || activeBooking.name || '-';
    const username = activeBooking.user?.username || activeBooking.username || '-';

    ctx.fillStyle = '#111827'; // gray-900
    ctx.font = 'bold 22px Inter, Arial';
    ctx.fillText(hotelName, 24, 110);
    ctx.font = '16px Inter, Arial';
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.fillText(hotelLoc, 24, 136);

    ctx.fillStyle = '#111827';
    const lines = [
      `Transaction ID: ${trxId}`,
      `Booked At: ${createdAt}`,
      `Name: ${customerName}`,
      `Username: ${username}`,
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut}`,
      `Days: ${daysVal}`,
      `Room: ${roomStr}`,
      `Total: ${totalStr}`,
      `Initial Payment: ${initStr}`
    ];
    let y = 170;
    for (const line of lines) {
      ctx.font = '18px Inter, Arial';
      ctx.fillText(line, 24, y);
      y += 28;
    }

    // Footer
    ctx.font = '14px Inter, Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Thank you for booking with IndiaStay.', 24, height - 28);

    const id = (activeBooking._id || activeBooking.id || 'booking').toString();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ticket-${id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
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
                    {(b.roomNumber || b.roomType) && (
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500">Room:</span>
                        <div className="text-sm">{b.roomNumber ? `${b.roomNumber}` : '-'} {b.roomType ? `(${b.roomType})` : ''}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Total:</span>
                      <div className="text-sm font-semibold">{formatINR(b.totalPrice)}</div>
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
                  <div className="flex justify-end">
                    <button
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      onClick={() => setActiveBooking(b)}
                    >
                      <EyeIcon className="w-5 h-5" /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg">
              {/* Header table to keep header static and aligned */}
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="bg-linear-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
                    <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Days</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Total</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Room</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
              </table>

              {/* Scrollable body (scrollbar-custom applied) */}
              <div className="max-h-[60vh] overflow-auto scrollbar-custom">
                <table className="w-full table-fixed">
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                        <td className="py-4 px-6 font-medium text-gray-800">{b.hotel?.name || '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{b.days}</td>
                        <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                        <td className="py-4 px-6 text-gray-600">{b.roomNumber ? `${b.roomNumber}` : '-'} {b.roomType ? `(${b.roomType})` : ''}</td>
                        <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                          b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                          b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                          'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                        }`}>
                          {(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1) || '-'}
                        </span></td>
                        <td className="py-4 px-6">
                          <button
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            onClick={() => setActiveBooking(b)}
                          >
                            <EyeIcon className="w-5 h-5" /> View
                          </button>
                        </td>
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
    {activeBooking && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xl font-bold text-[#1a237e]">Booking Details</div>
              <div className="text-sm text-gray-500">{activeBooking.hotel?.name || '-'} • {activeBooking.hotel?.location || ''}</div>
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={closeModal}>✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Check-in</div>
              <div className="text-sm">{activeBooking.checkInDate ? formatDateTime(activeBooking.checkInDate) : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Check-out</div>
              <div className="text-sm">{activeBooking.checkOutDate ? formatDateTime(activeBooking.checkOutDate) : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Booked At</div>
              <div className="text-sm">{activeBooking.createdAt ? formatDateTime(activeBooking.createdAt) : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Days</div>
              <div className="text-sm">{activeBooking.days}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Room</div>
              <div className="text-sm">{activeBooking.roomNumber ? `${activeBooking.roomNumber}` : '-'} {activeBooking.roomType ? `(${activeBooking.roomType})` : ''}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Transaction ID</div>
              <div className="text-sm">{activeBooking.paymentDetails?.stripeChargeId || activeBooking.paymentDetails?.stripePaymentIntentId || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-sm">{activeBooking.user?.name || activeBooking.name || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Username</div>
              <div className="text-sm">{activeBooking.user?.username || activeBooking.username || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-sm font-semibold">{formatINR(activeBooking.totalPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Initial Payment</div>
              <div className="text-sm">{activeBooking.initialPayment ? formatINR(activeBooking.initialPayment) : '-'}</div>
            </div>
            {activeBooking.paymentDetails?.cardNumber && (
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">Card</div>
                <div className="text-sm">•••• •••• •••• {activeBooking.paymentDetails.cardNumber}</div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg" onClick={closeModal}>Close</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={downloadTicket}>Download</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
