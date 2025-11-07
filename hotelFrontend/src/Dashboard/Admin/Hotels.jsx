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
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="font-semibold text-lg">Hotels</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm text-gray-600">Filter:</label>
            <select 
              value={filter} 
              onChange={(e)=>{ setFilter(e.target.value); load(1, e.target.value); }} 
              className="border rounded px-3 py-2 text-sm w-full sm:w-48 lg:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Hotels</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {hotels.map(h => (
                <div key={h._id} className="border rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Name:</span>
                    <div className="font-medium">{h.name}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Owner:</span>
                    <div className="text-sm">{h.owner?.name || h.owner?.username || '-'}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500">Created:</span>
                      <div className="text-sm">{new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      h.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      h.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="px-2 py-1.5 bg-yellow-400 text-black rounded text-xs flex-1" onClick={()=>setStatus(h._id, 'pending')}>Pending</button>
                    <button className="px-2 py-1.5 bg-red-600 text-white rounded text-xs flex-1" onClick={()=>setStatus(h._id, 'rejected')}>Reject</button>
                    <button className="px-2 py-1.5 bg-green-600 text-white rounded text-xs flex-1" onClick={()=>setStatus(h._id, 'approved')}>Approve</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
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
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${h.status === 'approved' ? 'bg-green-100 text-green-800' : h.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{h.status}</span>
                          <div className="flex gap-2">
                            <button className="px-2 py-1 bg-yellow-400 text-black rounded text-sm" onClick={()=>setStatus(h._id, 'pending')}>Pending</button>
                            <button className="px-2 py-1 bg-red-600 text-white rounded text-sm" onClick={()=>setStatus(h._id, 'rejected')}>Reject</button>
                            <button className="px-2 py-1 bg-green-600 text-white rounded text-sm" onClick={()=>setStatus(h._id, 'approved')}>Approve</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1, filter)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1, filter)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Next</button>
        </div>
      </div>
    </Layout>
  );
}
