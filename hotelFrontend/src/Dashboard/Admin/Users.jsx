import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [username, setUsername] = useState('');

  const load = async (p=1) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ role: 'user', page: p, limit });
      setUsers(res.data);
      setTotal(res.total);
      setPage(res.page);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  const startEdit = (u) => { setEditRow(u._id); setUsername(u.username); };
  const saveEdit = async (id) => { await adminService.updateUser(id, { username }); setEditRow(null); load(page); };
  const remove = async (id) => { if (confirm('Delete user?')) { await adminService.deleteUser(id); load(page); } };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Users">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="font-semibold mb-4">Users (role: user)</div>
        {loading ? 'Loading...' : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b"><th className="py-2">Username</th><th className="py-2">Created</th><th className="py-2">Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b">
                  <td className="py-2">
                    {editRow===u._id ? (
                      <input className="border px-2 py-1" value={username} onChange={(e)=>setUsername(e.target.value)} />
                    ) : u.username}
                  </td>
                  <td className="py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 flex gap-2">
                    {editRow===u._id ? (
                      <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>saveEdit(u._id)}>Save</button>
                    ) : (
                      <button className="px-2 py-1 border rounded" onClick={()=>startEdit(u)}>Edit</button>
                    )}
                    <button className="px-2 py-1 border rounded" onClick={()=>remove(u._id)}>Delete</button>
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
