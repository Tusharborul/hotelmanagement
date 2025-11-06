import React, {useEffect, useState} from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminHotels(){
  const [hotels, setHotels] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const limit = 20;

  const load = async (p=1, status) => {
    setLoading(true);
    try{
      const params = { page: p, limit };
      if (status && status !== 'all') params.status = status;
      const res = await adminService.getHotels(params);
      setHotels(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    }catch(err){
      console.error('Failed to load hotels', err);
    }finally{ setLoading(false); }
  };

  useEffect(()=>{ load(1); }, []);

  const setStatus = async (hotelId, status) => {
    if (!confirm(`Set status to ${status} for this hotel?`)) return;
    try{
      await adminService.updateHotelStatus(hotelId, status);
      await load(page, filter);
    }catch(err){
      console.error('Failed to update hotel status', err);
      alert('Failed to update status');
    }
  };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Hotels">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Hotels</div>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e)=>{ setFilter(e.target.value); load(1, e.target.value); }} className="border px-2 py-1">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? 'Loading...' : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b"><th className="py-2">Name</th><th className="py-2">Owner</th><th className="py-2">Created</th><th className="py-2">Action</th></tr>
            </thead>
            <tbody>
              {hotels.map(h => (
                <tr key={h._id} className="border-b">
                  <td className="py-2">{h.name}</td>
                  <td className="py-2">{h.owner?.name || h.owner?.username || ''}</td>
                  <td className="py-2">{new Date(h.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs px-2 py-1 rounded ${h.status === 'approved' ? 'bg-green-100 text-green-800' : h.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{h.status}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-yellow-400 text-black rounded" onClick={()=>setStatus(h._id, 'pending')}>Mark Pending</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>setStatus(h._id, 'rejected')}>Reject</button>
                        <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={()=>setStatus(h._id, 'approved')}>Approve</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-between mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1, filter)} className="border px-3 py-1 rounded disabled:opacity-50">Prev</button>
          <div>Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1, filter)} className="border px-3 py-1 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </Layout>
  );
}
