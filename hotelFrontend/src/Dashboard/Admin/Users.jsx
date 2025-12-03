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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editForm, setEditForm] = useState({});

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
  const startEditModal = (u) => { setEditRow(u._id); setUsername(u.username); setEditForm({
    username: u.username || '',
    name: u.name || '',
    email: u.email || '',
    countryCode: u.countryCode || '',
    phone: u.phone || '',
    country: u.country || '',
    nic: u.nic || '',
    role: u.role || 'user'
  }); setShowEditModal(true); };
  const startViewModal = (u) => { setViewUser(u); setShowViewModal(true); };
  const saveEdit = async (id) => {
    try {
      const payload = showEditModal ? editForm : { username };
      await adminService.updateUser(id, payload);
      setEditRow(null);
      setShowEditModal(false);
      setEditForm({});
      load(page);
    } catch (err) {
      console.error('Failed to save user', err);
    }
  };
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
                      <button className="px-3 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm flex-1 hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>saveEdit(u._id)} title="Save">
                        💾
                      </button>
                      ) : (
                      <button className="px-3 py-2 border-2 border-blue-500 text-blue-600 rounded-xl text-sm hover:bg-blue-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>startEditModal(u)} title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    <button className="px-3 py-2 border-2 border-blue-300 text-blue-600 rounded-xl text-sm hover:bg-blue-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>startViewModal(u)} title="View">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="px-3 py-2 border-2 border-red-500 text-red-600 rounded-xl text-sm hover:bg-red-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>remove(u._id)} title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22" />
                      </svg>
                    </button>
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
                          <button className="px-3 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>saveEdit(u._id)} title="Save">
                            💾
                          </button>
                        ) : (
                          <button className="px-3 py-2 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>startEditModal(u)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        <button className="px-3 py-2 border-2 border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>startViewModal(u)} title="View">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="px-3 py-2 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>remove(u._id)} title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22" />
                          </svg>
                        </button>
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
        <div className="text-sm font-bold mb-3 text-gray-800">Edit user</div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Username</label>
            <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.username || ''} onChange={(e)=>setEditForm({...editForm, username: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Name</label>
            <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.name || ''} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">E-mail</label>
            <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.email || ''} onChange={(e)=>setEditForm({...editForm, email: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Country Code</label>
              <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.countryCode || ''} onChange={(e)=>setEditForm({...editForm, countryCode: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Phone</label>
              <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.phone || ''} onChange={(e)=>setEditForm({...editForm, phone: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Country</label>
            <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.country || ''} onChange={(e)=>setEditForm({...editForm, country: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Adhar Card Number</label>
            <input className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.nic || ''} onChange={(e)=>setEditForm({...editForm, nic: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Role</label>
            <select className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.role || 'user'} onChange={(e)=>setEditForm({...editForm, role: e.target.value})}>
              <option value="user">User</option>
              <option value="hotelOwner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition" onClick={()=>{ setShowEditModal(false); setEditRow(null); setEditForm({}); }}>Cancel</button>
            <button className="px-5 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md hover:scale-105 transition-transform" onClick={()=>saveEdit(editRow)}>Save</button>
          </div>
        </div>
      </Modal>
      
      <Modal title="User Details" open={showViewModal} onClose={()=>{ setShowViewModal(false); setViewUser(null); }} size="md">
        {viewUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl text-blue-600">{(viewUser.name||viewUser.username||'').charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-lg font-semibold text-gray-800">{viewUser.name || viewUser.username}</div>
                <div className="text-xs text-gray-500">@{viewUser.username}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-xs text-gray-500">E-mail</div><div className="font-medium">{viewUser.email || '-'}</div>
              <div className="text-xs text-gray-500">Phone</div><div className="font-medium">{(viewUser.countryCode||'') + ' ' + (viewUser.phone||'-')}</div>
              <div className="text-xs text-gray-500">Country</div><div className="font-medium">{viewUser.country || '-'}</div>
              <div className="text-xs text-gray-500">Adhar Card Number</div><div className="font-medium">{viewUser.nic || '-'}</div>
              <div className="text-xs text-gray-500">Role</div><div className="font-medium">{viewUser.role || '-'}</div>
              <div className="text-xs text-gray-500">Created</div><div className="font-medium">{formatDateTime(viewUser.createdAt)}</div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50" onClick={()=>{ setShowViewModal(false); setViewUser(null); }}>Close</button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">No user selected</div>
        )}
      </Modal>
    </Layout>
  );
}
