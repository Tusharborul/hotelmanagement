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
    setShowEditModal(true);
  };
  
  const save = async (ownerData) => {
    try {
      const ownerId = ownerData._id || editId;
      console.log('Saving owner:', ownerId, 'with username:', username, 'and status:', status);
      
      await adminService.updateUser(ownerId, { username });
      if (status === 'approved') {
        await adminService.updateUser(ownerId, { ownerApproved: true });
      } else {
        await adminService.updateUser(ownerId, { ownerApproved: false });
        await adminService.updateOwnerHotelsStatus(ownerId, status);
      }
      
      setEditId(null); 
      setShowEditModal(false); 
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
                      <button className="px-4 py-2 border-2 border-purple-500 text-purple-600 rounded-xl text-sm flex-1 hover:bg-purple-50 hover:scale-105 transition-all duration-300" onClick={()=>startEdit(o)}>Edit</button>
                    )}
                    <button className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-xl text-sm flex-1 hover:bg-red-50 hover:scale-105 transition-all duration-300" onClick={()=>remove(o._id)}>Delete</button>
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
                          <button className="px-4 py-2 border-2 border-purple-500 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors duration-300" onClick={()=>startEdit(o)}>Edit</button>
                        )}
                        <button className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-300" onClick={()=>remove(o._id)}>Delete</button>
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
        <div className="space-y-3">
          <label className="text-xs text-gray-600">Username</label>
          <input className="border rounded px-2 py-1 w-full text-sm" value={username} onChange={(e)=>setUsername(e.target.value)} />
          <label className="text-xs text-gray-600">Status</label>
          <select className="border rounded px-3 py-2 w-full text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 border rounded" onClick={()=>{ setShowEditModal(false); setEditId(null); }}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>save({})}>Save</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
