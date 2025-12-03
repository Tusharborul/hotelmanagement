import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatDateTime } from '../../utils/date';

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;
  const [editId, setEditId] = useState(null);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('pending');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOwner, setViewOwner] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const deriveStatus = (o) => {
    if (o.ownerApproved) return 'approved';
    const arr = o.statuses || [];
    if (!arr.length) return 'pending';
    const set = new Set(arr);
    if (set.size === 1) return arr[0];
    if (set.has('approved')) return 'approved';
    if (set.has('rejected')) return 'rejected';
    return 'pending';
  };

  const startEdit = (o) => { 
    setEditId(o._id); 
    setUsername(o.username); 
    setStatus(deriveStatus(o)); 
  };
  
  const startEditModal = (o) => {
    setEditId(o._id); 
    setUsername(o.username); 
    setStatus(deriveStatus(o)); 
    setEditForm({
      username: o.username || '',
      name: o.name || '',
      email: o.email || '',
      countryCode: o.countryCode || '',
      phone: o.phone || '',
      country: o.country || '',
      nic: o.nic || '',
      role: o.role || 'hotelOwner'
    });
    setShowEditModal(true);
  };

  const startViewModal = (o) => { setViewOwner(o); setShowViewModal(true); };
  
  const save = async (ownerData) => {
    try {
      const ownerId = ownerData._id || editId;
      console.log('Saving owner:', ownerId, 'with username:', username, 'and status:', status);
      const payload = showEditModal ? editForm : { username };
      await adminService.updateUser(ownerId, payload);
      if (status === 'approved') {
        await adminService.updateUser(ownerId, { ownerApproved: true });
      } else {
        await adminService.updateUser(ownerId, { ownerApproved: false });
        await adminService.updateOwnerHotelsStatus(ownerId, status);
      }
      
      setEditId(null); 
      setShowEditModal(false); 
      setEditForm({});
      load(page);
    } catch (error) {
      console.error('Failed to save owner:', error);
      alert('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  };

  const remove = async (id) => { const { confirmAsync } = await import('../../utils/confirm'); if (await confirmAsync('Delete owner?')) { await adminService.deleteUser(id); load(page); } };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Hotel Owners">
    
        <div className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Hotel Owners Management</div>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading owners..." /></div>
        ) : (
          <div className="space-y-3">
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {owners.map(o => (
                <div key={o._id} className="border-2 border-purple-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-purple-300 transition-all duration-300">
                  <div>
                    <span className="text-xs text-gray-500">Username:</span>
                    {editId===o._id && !showEditModal ? (
                      <input className="border rounded px-2 py-1 w-full mt-1 text-sm"  name="username" value={username} onChange={(e)=>setUsername(e.target.value)} />
                    ) : (
                      <div className="font-medium">{o.username}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status:</span>
                    {editId===o._id && !showEditModal ? (
                      <select className="border rounded px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"  name="status" value={status} onChange={(e)=>setStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <div className="text-sm mt-1">
                        {(() => { const s = deriveStatus(o); return (
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                            s === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                            s === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                            'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                          }`}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </span>
                        ); })()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created:</span>
                    <div className="text-sm">{formatDateTime(o.createdAt)}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editId===o._id && !showEditModal ? (
                      <button className="px-4 py-2 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm flex-1 hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>save(o)}>Save</button>
                    ) : (
                      <button className="px-3 py-2 border-2 border-purple-500 text-purple-600 rounded-xl text-sm hover:bg-purple-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>startEditModal(o)} title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    <button className="px-3 py-2 border-2 border-purple-300 text-purple-600 rounded-xl text-sm hover:bg-purple-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>startViewModal(o)} title="View">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="px-3 py-2 border-2 border-red-500 text-red-600 rounded-xl text-sm hover:bg-red-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>remove(o._id)} title="Delete">
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
                  <tr className="bg-linear-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200"><th className="py-4 px-6 font-semibold text-gray-700">Username</th><th className="py-4 px-6 font-semibold text-gray-700">Status</th><th className="py-4 px-6 font-semibold text-gray-700">Created</th><th className="py-4 px-6 font-semibold text-gray-700">Action</th></tr>
                </thead>
                <tbody>
                      {owners.map(o => (
                    <tr key={o._id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors duration-200">
                      <td className="py-4 px-6">
                        {editId===o._id ? (
                          <input className="border-2 border-purple-300 px-3 py-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"  name="username" value={username} onChange={(e)=>setUsername(e.target.value)} />
                        ) : <span className="font-medium text-gray-800">{o.username}</span>}
                      </td>
                      <td className="py-4 px-6">
                        {editId===o._id ? (
                          <select className="border-2 border-purple-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"  name="status" value={status} onChange={(e)=>setStatus(e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : (() => { const s = deriveStatus(o); return (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                            s === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                            s === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                            'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                          }`}>{s}</span>
                        ); })()}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{formatDateTime(o.createdAt)}</td>
                      <td className="py-4 px-6 flex gap-2">
                        {editId===o._id && !showEditModal ? (
                          <button className="px-4 py-2 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>save(o)}>Save</button>
                        ) : (
                          <button className="px-3 py-2 border-2 border-purple-500 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>startEditModal(o)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        <button className="px-3 py-2 border-2 border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>startViewModal(o)} title="View">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="px-3 py-2 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>remove(o._id)} title="Delete">
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
    
      {/* Edit Owner Modal */}
      <Modal title="Edit Owner" open={showEditModal} onClose={()=>{ setShowEditModal(false); setEditId(null); }} size="md">
        <div className="text-sm font-bold mb-3 text-gray-800">Edit owner</div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Username</label>
            <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.username || ''} onChange={(e)=>setEditForm({...editForm, username: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Name</label>
            <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.name || ''} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">E-mail</label>
            <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.email || ''} onChange={(e)=>setEditForm({...editForm, email: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Country Code</label>
              <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.countryCode || ''} onChange={(e)=>setEditForm({...editForm, countryCode: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Phone</label>
              <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.phone || ''} onChange={(e)=>setEditForm({...editForm, phone: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Country</label>
            <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.country || ''} onChange={(e)=>setEditForm({...editForm, country: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Adhar Card Number</label>
            <input className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.nic || ''} onChange={(e)=>setEditForm({...editForm, nic: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Role</label>
            <select className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={editForm.role || 'hotelOwner'} onChange={(e)=>setEditForm({...editForm, role: e.target.value})}>
              <option value="user">User</option>
              <option value="hotelOwner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-2 font-semibold">Status</label>
            <select className="border-2 border-purple-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition" onClick={()=>{ setShowEditModal(false); setEditId(null); setEditForm({}); }}>Cancel</button>
            <button className="px-5 py-2 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md hover:scale-105 transition-transform" onClick={()=>save({})}>Save</button>
          </div>
        </div>
      </Modal>

      {/* Owner Details Modal */}
      <Modal title="Owner Details" open={showViewModal} onClose={()=>{ setShowViewModal(false); setViewOwner(null); }} size="md">
        {viewOwner ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl text-purple-600">{(viewOwner.name||viewOwner.username||'').charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-lg font-semibold text-gray-800">{viewOwner.name || viewOwner.username}</div>
                <div className="text-xs text-gray-500">@{viewOwner.username}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-xs text-gray-500">E-mail</div><div className="font-medium">{viewOwner.email || '-'}</div>
              <div className="text-xs text-gray-500">Phone</div><div className="font-medium">{(viewOwner.countryCode||'') + ' ' + (viewOwner.phone||'-')}</div>
              <div className="text-xs text-gray-500">Country</div><div className="font-medium">{viewOwner.country || '-'}</div>
              <div className="text-xs text-gray-500">Adhar Card Number</div><div className="font-medium">{viewOwner.nic || '-'}</div>
              <div className="text-xs text-gray-500">Role</div><div className="font-medium">{viewOwner.role || '-'}</div>
              <div className="text-xs text-gray-500">Created</div><div className="font-medium">{formatDateTime(viewOwner.createdAt)}</div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50" onClick={()=>{ setShowViewModal(false); setViewOwner(null); }}>Close</button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">No owner selected</div>
        )}
      </Modal>
    </Layout>
  );
}
