import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;
  const [editId, setEditId] = useState(null);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('pending');

  const load = async (p=1) => {
    setLoading(true);
    try {
      const res = await adminService.getOwners({ page: p, limit });
      setOwners(res.data);
      setTotal(res.total);
      setPage(res.page);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(1); }, []);

  const startEdit = (o) => { setEditId(o._id); setUsername(o.username); setStatus((o.statuses && o.statuses[0]) || 'pending'); };
  const save = async (o) => {
    await adminService.updateUser(o._id, { username });
    // If there's at least one hotel, update first hotel's status for demo
    if (o.statuses && o.statuses.length && o.hotels && o.hotels[0]?._id) {
      await adminService.updateHotelStatus(o.hotels[0]._id, status);
    }
    setEditId(null); load(page);
  };

  const remove = async (id) => { if (confirm('Delete owner?')) { await adminService.deleteUser(id); load(page); } };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Hotel Owners">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="font-semibold mb-4 text-lg">Owners (role: hotelOwner)</div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {owners.map(o => (
                <div key={o._id} className="border rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Username:</span>
                    {editId===o._id ? (
                      <input className="border rounded px-2 py-1 w-full mt-1 text-sm" value={username} onChange={(e)=>setUsername(e.target.value)} />
                    ) : (
                      <div className="font-medium">{o.username}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status:</span>
                    {editId===o._id ? (
                      <select className="border rounded px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={status} onChange={(e)=>setStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <div className="text-sm mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          (o.statuses && o.statuses[0]) === 'approved' ? 'bg-green-100 text-green-700' :
                          (o.statuses && o.statuses[0]) === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {((o.statuses && o.statuses[0]) || 'pending').charAt(0).toUpperCase() + ((o.statuses && o.statuses[0]) || 'pending').slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created:</span>
                    <div className="text-sm">{new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editId===o._id ? (
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex-1" onClick={()=>save(o)}>Save</button>
                    ) : (
                      <button className="px-3 py-1.5 border rounded text-sm flex-1" onClick={()=>startEdit(o)}>Edit</button>
                    )}
                    <button className="px-3 py-1.5 border rounded text-red-600 text-sm flex-1" onClick={()=>remove(o._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b"><th className="py-2">Username</th><th className="py-2">Status</th><th className="py-2">Created</th><th className="py-2">Action</th></tr>
                </thead>
                <tbody>
                  {owners.map(o => (
                    <tr key={o._id} className="border-b">
                      <td className="py-2">
                        {editId===o._id ? (
                          <input className="border px-2 py-1 rounded" value={username} onChange={(e)=>setUsername(e.target.value)} />
                        ) : o.username}
                      </td>
                      <td className="py-2">
                        {editId===o._id ? (
                          <select className="border px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={status} onChange={(e)=>setStatus(e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : ((o.statuses && o.statuses[0]) || 'pending')}
                      </td>
                      <td className="py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 flex gap-2">
                        {editId===o._id ? (
                          <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>save(o)}>Save</button>
                        ) : (
                          <button className="px-2 py-1 border rounded" onClick={()=>startEdit(o)}>Edit</button>
                        )}
                        <button className="px-2 py-1 border rounded text-red-600" onClick={()=>remove(o._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1)} className="border px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-sm">Next</button>
        </div>
      </div>
    </Layout>
  );
}
