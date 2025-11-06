import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';

export default function OwnerBookings() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(()=>{ (async()=>{
    const res = await hotelService.getMyHotels();
    setHotels(res.data || []);
    if (res.data?.[0]?._id) { setSelected(res.data[0]._id); }
  })(); },[]);

  useEffect(()=>{ (async()=>{
    if (!selected) return; 
    const r = await bookingService.getHotelBookings(selected);
    const data = Array.isArray(r) ? r : (r?.data || []);
    setBookings(data);
  })(); }, [selected]);

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Bookings">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="mr-2">Hotel:</label>
          <select className="border px-2 py-1" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>
        <table className="w-full text-left">
          <thead><tr className="border-b"><th className="py-2">User</th><th className="py-2">Check-in</th><th className="py-2">Days</th><th className="py-2">Total</th><th className="py-2">Status</th></tr></thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b._id} className="border-b">
                <td className="py-2">{b.user?.name || b.user?.username}</td>
                <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</td>
                <td className="py-2">{b.days}</td>
                <td className="py-2">${b.totalPrice}</td>
                <td className="py-2">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
