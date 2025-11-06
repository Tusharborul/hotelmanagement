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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="font-semibold mb-4">Your Bookings</div>
        {loading ? 'Loading...' : bookings.length === 0 ? 'No bookings yet.' : (
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
        )}
      </div>
    </Layout>
  );
}
