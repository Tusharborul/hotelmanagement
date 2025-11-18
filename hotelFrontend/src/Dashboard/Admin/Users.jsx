import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatDateTime } from '../../utils/date';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [username, setUsername] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

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
  const startEditModal = (u) => { setEditRow(u._id); setUsername(u.username); setShowEditModal(true); };
  const saveEdit = async (id) => { await adminService.updateUser(id, { username }); setEditRow(null); setShowEditModal(false); load(page); };
  const remove = async (id) => { const { confirmAsync } = await import('../../utils/confirm'); if (await confirmAsync('Delete user?')) { await adminService.deleteUser(id); load(page); } };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Users">
        <div className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Users Management</div>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading users..." /></div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {users.map(u => (
                <div key={u._id} className="border-2 border-blue-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  <div>
                    <span className="text-xs text-gray-500">Username:</span>
                    {editRow===u._id && !showEditModal ? (
                      <input className="border rounded px-2 py-1 w-full mt-1 text-sm"  name="username" value={username} onChange={(e)=>setUsername(e.target.value)} />
                    ) : (
                      <div className="font-medium">{u.username}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created:</span>
                    <div className="text-sm">{formatDateTime(u.createdAt)}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editRow===u._id && !showEditModal ? (
                      <button className="px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm flex-1 hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>saveEdit(u._id)}>Save</button>
                    ) : (
                      <button className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-xl text-sm flex-1 hover:bg-blue-50 hover:scale-105 transition-all duration-300" onClick={()=>startEditModal(u)}>Edit</button>
                    )}
                    <button className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-xl text-sm flex-1 hover:bg-red-50 hover:scale-105 transition-all duration-300" onClick={()=>remove(u._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-linear-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200"><th className="py-4 px-6 font-semibold text-gray-700">Username</th><th className="py-4 px-6 font-semibold text-gray-700">Created</th><th className="py-4 px-6 font-semibold text-gray-700">Action</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-4 px-6">
                        {editRow===u._id && !showEditModal ? (
                          <input className="border-2 border-blue-300 px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"  name="username" value={username} onChange={(e)=>setUsername(e.target.value)} />
                        ) : <span className="font-medium text-gray-800">{u.username}</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{formatDateTime(u.createdAt)}</td>
                      <td className="py-4 px-6 flex gap-2">
                        {editRow===u._id && !showEditModal ? (
                          <button className="px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>saveEdit(u._id)}>Save</button>
                        ) : (
                          <button className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-300" onClick={()=>startEditModal(u)}>Edit</button>
                        )}
                        <button className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-300" onClick={()=>remove(u._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p)} className="mt-6" />
    
      <Modal title="Edit User" open={showEditModal} onClose={()=>{ setShowEditModal(false); setEditRow(null); }} size="md">
        <div className="space-y-3">
          <label className="text-xs text-gray-600">Username</label>
          <input className="border rounded px-2 py-1 w-full text-sm" value={username} onChange={(e)=>setUsername(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 border rounded" onClick={()=>{ setShowEditModal(false); setEditRow(null); }}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>saveEdit(editRow)}>Save</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
