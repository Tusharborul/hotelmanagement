import React, {useEffect, useState} from 'react';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import Select from '../../components/Select';
import { showToast } from '../../utils/toast';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { formatDateTime } from '../../utils/date';
import getImageUrl from '../../utils/getImageUrl';

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
  const [showDocModal, setShowDocModal] = useState(false);
  const [docHotel, setDocHotel] = useState(null);
  const [docIndex, setDocIndex] = useState(0);

  // Cloudinary cloud name used by backend (fallback if documents are stored as public_id)
  const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || 'dmv1yn1k5';

  const openDocModal = (hotel) => { setDocHotel(hotel); setDocIndex(0); setShowDocModal(true); };

  // keyboard navigation for document viewer modal
  useEffect(() => {
    if (!showDocModal) return;
    const handler = (e) => {
      if (!docHotel || !Array.isArray(docHotel.documents) || !docHotel.documents.length) return;
      const len = docHotel.documents.length;
      if (e.key === 'ArrowRight') setDocIndex((i) => (i + 1) % len);
      if (e.key === 'ArrowLeft') setDocIndex((i) => (i - 1 + len) % len);
      if (e.key === 'Escape') { setShowDocModal(false); setDocHotel(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDocModal, docHotel]);

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Hotels">
    
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="bg-linear-to-r from-green-600 to-teal-600 bg-clip-text text-transparent font-bold text-2xl">Hotels Management</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-semibold text-gray-700">Filter:</label>
            <div className="w-full sm:w-48 lg:w-56">
              <Select
                id="admin-filter"
                name="filter"
                value={filter}
                onChange={(v) => { setFilter(v); load(1, v); }}
                options={[
                  { value: 'all', label: 'All Hotels' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
                placeholder={null}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner label="Loading hotels..." /></div>
        ) : (
          <div className="space-y-3">
            {/* Status change modal (Edit) */}
            <Modal title="Edit Hotel Status" open={showStatusModal} onClose={()=>{ setShowStatusModal(false); setStatusModalHotelId(null); }} size="md">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-28 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                    {selectedStatusHotel?.mainImage ? (
                      <img src={getImageUrl(selectedStatusHotel.mainImage)} alt="main" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Hotel</div>
                    <div className="font-semibold text-lg leading-5">{selectedStatusHotel?.name || '-'}</div>
                    <div className="text-xs text-gray-500 mt-1">Owner: <span className="font-medium">{selectedStatusHotel?.owner?.name || selectedStatusHotel?.owner?.username || '-'}</span></div>
                    {selectedStatusHotel?.registrationNo ? (
                      <div className="text-xs text-gray-500 mt-1">Reg. No: <span className="font-medium">{selectedStatusHotel.registrationNo}</span></div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-700 mb-3 font-semibold">Change status</div>
                  <div className="flex gap-3">
                    <button onClick={()=>setStatusModalStatus('pending')} className={`px-4 py-2 rounded-full border ${statusModalStatus==='pending' ? 'bg-linear-to-r from-yellow-100 to-yellow-50 border-yellow-400 shadow-sm' : 'bg-white border-gray-200'}`}>Pending</button>
                    <button onClick={()=>setStatusModalStatus('approved')} className={`px-4 py-2 rounded-full border ${statusModalStatus==='approved' ? 'bg-linear-to-r from-green-100 to-green-50 border-green-400 shadow-sm' : 'bg-white border-gray-200'}`}>Approved</button>
                    <button onClick={()=>setStatusModalStatus('rejected')} className={`px-4 py-2 rounded-full border ${statusModalStatus==='rejected' ? 'bg-linear-to-r from-red-100 to-red-50 border-red-400 shadow-sm' : 'bg-white border-gray-200'}`}>Rejected</button>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition" onClick={()=>{ setShowStatusModal(false); setStatusModalHotelId(null); }}>Cancel</button>
                  <button className="px-5 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-md hover:scale-105 transition-transform" onClick={saveStatusFromModal}>Save changes</button>
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
                    <button className="px-3 py-2 border-2 border-green-500 text-green-600 rounded-xl text-sm hover:bg-green-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>openStatusModal(h._id, h.status)} title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="px-3 py-2 border-2 border-green-300 text-green-600 rounded-xl text-sm hover:bg-green-50 hover:scale-105 transition-all duration-300 flex items-center justify-center" onClick={()=>openDocModal(h)} title="View Documents">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg">
              {/* Header table */}
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="bg-linear-to-r from-green-50 to-teal-50 border-b-2 border-green-200">
                    <th className="py-4 px-6 font-semibold text-gray-700">Name</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Owner</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Created</th>
                    <th className="py-4 px-6 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
              </table>

              {/* Scrollable body */}
              <div className="max-h-[58vh] overflow-auto scrollbar-custom">
                <table className="w-full table-fixed">
                  <tbody>
                    {hotels.map(h => (
                      <tr key={h._id} className="border-b border-gray-100 hover:bg-green-50 transition-colors duration-200">
                        <td className="py-4 px-6 font-medium text-gray-800">{h.name}</td>
                        <td className="py-4 px-6 text-gray-600">{h.owner?.name || h.owner?.username || ''}</td>
                        <td className="py-4 px-6">
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${h.status === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' : h.status === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' : 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'}`}>{h.status}</span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{formatDateTime(h.createdAt)}</td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button className="px-3 py-2 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>openStatusModal(h._id, h.status)} title="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className="px-3 py-2 border-2 border-green-300 text-green-600 rounded-xl hover:bg-green-50 transition-colors duration-300 flex items-center justify-center" onClick={()=>openDocModal(h)} title="View Documents">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p, filter)} className="mt-6" />
     
      {/* Documents Viewer Modal (View) - cleaner UI */}
      <Modal title="Documents" open={showDocModal} onClose={()=>{ setShowDocModal(false); setDocHotel(null); }} size="lg">
        {docHotel ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex shrink-0 shadow-sm">
                {docHotel?.mainImage ? (
                  <img src={getImageUrl(docHotel.mainImage)} alt="main" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Hotel</div>
                <div className="font-semibold text-lg leading-5">{docHotel.name || '-'}</div>
                <div className="text-xs text-gray-500 mt-1">Created: <span className="font-medium">{formatDateTime(docHotel.createdAt)}</span></div>
              </div>
            </div>

            {/* Large preview */}
            {Array.isArray(docHotel.documents) && docHotel.documents.length ? (
              (() => {
                const docs = docHotel.documents;
                const current = docs[docIndex];
                let src = '';
                if (typeof current === 'object') src = getImageUrl(current) || '';
                else if (typeof current === 'string') {
                  if (current.startsWith('http')) src = current;
                  else if (current.includes('/')) src = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${current}`;
                  else src = getImageUrl(current) || '';
                }
                return (
                  <div>
                    <div className="relative">
                      <div className="w-full bg-gray-50 rounded-xl p-6 flex items-center justify-center border border-gray-100 shadow-sm">
                        {src ? (
                          <a href={src} target="_blank" rel="noreferrer" className="block max-w-full max-h-[72vh]">
                            <img src={src} alt={`doc-${docIndex}`} className="max-w-full max-h-[72vh] object-contain rounded" />
                          </a>
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center text-sm text-gray-500">No preview available</div>
                        )}
                      </div>

                      {/* left/right arrows */}
                      {docs.length > 1 && (
                        <>
                          <button onClick={() => setDocIndex((docIndex - 1 + docs.length) % docs.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 border rounded-full p-2 shadow hover:scale-105 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button onClick={() => setDocIndex((docIndex + 1) % docs.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 border rounded-full p-2 shadow hover:scale-105 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}

                      <div className="absolute right-3 top-3 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">{docIndex + 1}/{docs.length}</div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-gray-600">Document {docIndex + 1} of {docs.length}</div>
                      {src ? (
                        <a className="inline-flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-blue-600 to-blue-500 text-white rounded shadow" href={src} target="_blank" rel="noreferrer">Open full image</a>
                      ) : null}
                    </div>

                    {docs.length > 1 && (
                      <div className="flex gap-2 items-center justify-start mt-4 overflow-x-auto py-1">
                        {docs.map((d, i) => {
                          let thumb = '';
                          if (typeof d === 'object') thumb = getImageUrl(d) || '';
                          else if (typeof d === 'string') {
                            if (d.startsWith('http')) thumb = d;
                            else if (d.includes('/')) thumb = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${d}`;
                            else thumb = getImageUrl(d) || '';
                          }
                          return (
                            <button key={i} onClick={()=>setDocIndex(i)} className={`flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border ${i===docIndex? 'ring-2 ring-indigo-300': 'border-gray-200'} hover:scale-105 transition-transform`}> 
                              {thumb ? <img src={thumb} alt={`thumb-${i}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No preview</div>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="py-6 text-center text-gray-500">No documents available</div>
            )}

            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 bg-white border rounded" onClick={()=>{ setShowDocModal(false); setDocHotel(null); }}>Close</button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500">No hotel selected</div>
        )}
      </Modal>
    </Layout>
  );
}

