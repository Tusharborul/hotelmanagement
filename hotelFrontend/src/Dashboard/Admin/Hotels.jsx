import React, {useEffect, useState} from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatDateTime } from '../../utils/date';

export default function AdminHotels(){
  const [hotels, setHotels] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const limit = 10;

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

  // Modal-driven status change
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalHotelId, setStatusModalHotelId] = useState(null);
  const [statusModalStatus, setStatusModalStatus] = useState('pending');

  const openStatusModal = (hotelId, currentStatus) => {
    setStatusModalHotelId(hotelId);
    setStatusModalStatus(currentStatus || 'pending');
    setShowStatusModal(true);
  };

  const saveStatusFromModal = async () => {
    if (!statusModalHotelId) return;
    try {
      await adminService.updateHotelStatus(statusModalHotelId, statusModalStatus);
      setShowStatusModal(false);
      setStatusModalHotelId(null);
      await load(page, filter);
    } catch (err) {
      console.error('Failed to update hotel status', err);
      showToast('Failed to update status', 'error');
    }
  };

  // selected hotel for modal display
  const selectedStatusHotel = hotels.find(h => h._id === statusModalHotelId) || null;

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Hotels">
    
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="bg-linear-to-r from-green-600 to-teal-600 bg-clip-text text-transparent font-bold text-2xl">Hotels Management</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-semibold text-gray-700">Filter:</label>
            <select 
               name="filter" value={filter} 
              onChange={(e)=>{ setFilter(e.target.value); load(1, e.target.value); }} 
              className="border-2 border-green-300 rounded-xl px-4 py-2.5 text-sm w-full sm:w-48 lg:w-56 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-medium text-gray-700 cursor-pointer hover:border-green-400 transition-colors duration-300"
            >
              <option value="all">All Hotels</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading hotels..." /></div>
        ) : (
          <div className="space-y-3">
            {/* Status change modal */}
            <Modal title="Change Hotel Status" open={showStatusModal} onClose={()=>{ setShowStatusModal(false); setStatusModalHotelId(null); }} size="md">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">Hotel:</div>
                  <div className="font-medium">{selectedStatusHotel?.name || '-'}</div>
                </div>
                <div className="text-sm text-gray-700">Select new status for this hotel:</div>
                <select className="border px-3 py-2 rounded w-full text-sm" value={statusModalStatus} onChange={(e)=>setStatusModalStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 border rounded" onClick={()=>{ setShowStatusModal(false); setStatusModalHotelId(null); }}>Cancel</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveStatusFromModal}>Save</button>
                </div>
              </div>
            </Modal>
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">
              {hotels.map(h => (
                <div key={h._id} className="border-2 border-green-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-green-300 transition-all duration-300">
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
                      <div className="text-sm">{formatDateTime(h.createdAt)}</div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
                      h.status === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' : 
                      h.status === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' : 
                      'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="px-4 py-2 bg-linear-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm flex-1 hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>openStatusModal(h._id, h.status)}>Change Status</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-linear-to-r from-green-50 to-teal-50 border-b-2 border-green-200"><th className="py-4 px-6 font-semibold text-gray-700">Name</th><th className="py-4 px-6 font-semibold text-gray-700">Owner</th><th className="py-4 px-6 font-semibold text-gray-700">Created</th><th className="py-4 px-6 font-semibold text-gray-700">Action</th></tr>
                </thead>
                <tbody>
                  {hotels.map(h => (
                    <tr key={h._id} className="border-b border-gray-100 hover:bg-green-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-medium text-gray-800">{h.name}</td>
                      <td className="py-4 px-6 text-gray-600">{h.owner?.name || h.owner?.username || ''}</td>
                      <td className="py-4 px-6 text-gray-600">{formatDateTime(h.createdAt)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${h.status === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' : h.status === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' : 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'}`}>{h.status}</span>
                          <div className="flex gap-2">
                            <button className="px-4 py-2 bg-linear-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm hover:scale-105 transition-transform duration-300 shadow-md" onClick={()=>openStatusModal(h._id, h.status)}>Change Status</button>
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

        <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p, filter)} className="mt-6" />
     
    </Layout>
  );
}
