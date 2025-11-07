import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminBookingDetails() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async (p=1) => {
    const res = await adminService.getBookings({ start, end, page: p, limit, field: field === 'checkin' ? 'checkin' : undefined });
    let items = res.data || [];

    // Client-side fallback: if 'checkin' filter selected, ensure we filter by booking.checkInDate
    if (field === 'checkin' && (start || end)) {
      const s = start ? new Date(start) : null;
      const e = end ? (() => { const d = new Date(end); d.setHours(23,59,59,999); return d; })() : null;
      items = (items || []).filter(b => {
        if (!b.checkInDate) return false;
        const d = new Date(b.checkInDate);
        if (s && d < s) return false;
        if (e && d > e) return false;
        return true;
      });
    }

    setData(items);
    // If we performed client-side filtering, update total to the filtered count so pagination reflects results
    setTotal((field === 'checkin' && (start || end)) ? items.length : res.total);
    setPage(res.page);
  };

  useEffect(()=>{ load(1); }, []);



  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Booking Details">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">Start</label>
            <input type="date" className="border rounded px-3 py-1.5 w-full text-sm" value={start} onChange={(e)=>setStart(e.target.value)} />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">End</label>
            <input type="date" className="border rounded px-3 py-1.5 w-full text-sm" value={end} onChange={(e)=>setEnd(e.target.value)} />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">Filter by</label>
            <select value={field} onChange={(e)=>setField(e.target.value)} className="border rounded px-3 py-1.5 w-full text-sm">
              <option value="created">Created</option>
              <option value="checkin">Check-in</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto text-sm" onClick={()=>load(1)}>Filter</button>
        </div>

        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {data?.map(b => (
              <div key={b._id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-gray-500">User:</span>
                    <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded h-fit ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Hotel:</span>
                  <div className="text-sm">{b.hotel?.name}</div>
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
                    <span className="text-xs text-gray-500">Created:</span>
                    <div className="text-sm">{new Date(b.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {b.refundStatus && b.refundStatus !== 'none' && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-500">Refund:</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700">{b.refundStatus}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
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
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Next</button>
        </div>
      </div>
    </Layout>
  );
}
