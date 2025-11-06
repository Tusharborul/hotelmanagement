import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminBookingDetails() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async (p=1) => {
    const res = await adminService.getBookings({ start, end, page: p, limit });
    setData(res.data); setTotal(res.total); setPage(res.page);
  };

  useEffect(()=>{ load(1); }, []);



  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Booking Details">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-end gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-600">Start</label>
            <input type="date" className="border rounded px-2 py-1 ml-2" value={start} onChange={(e)=>setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">End</label>
            <input type="date" className="border rounded px-2 py-1 ml-2" value={end} onChange={(e)=>setEnd(e.target.value)} />
          </div>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>load(1)}>Filter</button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">User</th>
              <th className="py-2">Hotel</th>
              <th className="py-2">Check-in</th>
              <th className="py-2">Days</th>
              <th className="py-2">Total</th>
              <th className="py-2">Status</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data?.map(b => (
              <tr key={b._id} className="border-b">
                <td className="py-2">{b.user?.name || b.user?.username}</td>
                <td className="py-2">{b.hotel?.name}</td>
                <td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</td>
                <td className="py-2">{b.days}</td>
                <td className="py-2">${b.totalPrice}</td>
                <td className="py-2">{b.status}{b.refundStatus && b.refundStatus !== 'none' ? ` / ${b.refundStatus}` : ''}</td>
                <td className="py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1)} className="border px-3 py-1 rounded disabled:opacity-50">Prev</button>
          <div>Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1)} className="border px-3 py-1 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </Layout>
  );
}
