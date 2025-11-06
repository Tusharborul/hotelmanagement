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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="font-semibold mb-4">Owners (role: hotelOwner)</div>
        {loading ? 'Loading...' : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b"><th className="py-2">Username</th><th className="py-2">Status</th><th className="py-2">Created</th><th className="py-2">Action</th></tr>
            </thead>
            <tbody>
              {owners.map(o => (
                <tr key={o._id} className="border-b">
                  <td className="py-2">
                    {editId===o._id ? (
                      <input className="border px-2 py-1" value={username} onChange={(e)=>setUsername(e.target.value)} />
                    ) : o.username}
                  </td>
                  <td className="py-2">
                    {editId===o._id ? (
                      <select className="border px-2 py-1" value={status} onChange={(e)=>setStatus(e.target.value)}>
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
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
                    <button className="px-2 py-1 border rounded" onClick={()=>remove(o._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-between mt-4">
          <button disabled={page<=1} onClick={()=>load(page-1)} className="border px-3 py-1 rounded disabled:opacity-50">Prev</button>
          <div>Page {page} / {Math.max(1, Math.ceil(total/limit))}</div>
          <button disabled={page>=Math.ceil(total/limit)} onClick={()=>load(page+1)} className="border px-3 py-1 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </Layout>
  );
}
