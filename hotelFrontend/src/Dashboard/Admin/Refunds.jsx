import React, { useEffect, useState } from 'react';
import FilterControls from '../components/FilterControls';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/date';
import { formatINR } from '../../utils/currency';

export default function AdminRefunds() {
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [data, setData] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [allHotels, setAllHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async (p = 1, overrides = {}) => {
    setLoading(true);
    const s = overrides.start !== undefined ? overrides.start : start;
    const e = overrides.end !== undefined ? overrides.end : end;
    const sel = overrides.selectedHotel !== undefined ? overrides.selectedHotel : selectedHotel;
    const f = overrides.field !== undefined ? overrides.field : field;
    const hotelsList = overrides.hotels !== undefined ? overrides.hotels : hotels;

    // Fetch a large page from server and paginate/filter on client so refund-only pages are stable
    const serverLimit = 1000;
    const apiParams = { page: 1, limit: serverLimit };
    if (f !== 'checkin') {
      if (s) apiParams.start = s;
      if (e) apiParams.end = e;
      if (f) apiParams.field = f;
    }

    try {
      const res = await adminService.getBookings(apiParams);
      let all = res.data || [];

      // Filter to refunds only
      let refunds = (all || []).filter(b => (Number(b.refundAmount || 0) > 0) || (b.refundStatus && b.refundStatus !== 'none'));

      // client-side hotel filter
      if (sel) {
        refunds = (refunds || []).filter(b => (b.hotel && (b.hotel._id || b.hotel.id) === sel) || b.hotelId === sel);
      }

      // owner filter when owner selected and no explicit hotel
      const selOwner = overrides.selectedOwner !== undefined ? overrides.selectedOwner : selectedOwner;
      if (selOwner && !sel) {
        const ownerHotelIds = (hotelsList || []).map(h => h._id || h.id);
        refunds = (refunds || []).filter(b => {
          const hid = (b.hotel && (b.hotel._id || b.hotel.id)) || b.hotelId;
          return ownerHotelIds.includes(hid);
        });
      }

      // client-side checkin filtering (overlap semantics)
      if (f === 'checkin' && (s || e)) {
        const ss = s ? new Date(s) : null;
        const ee = e ? (() => { const d = new Date(e); d.setHours(23,59,59,999); return d; })() : null;
        refunds = (refunds || []).filter(b => {
          const ci = b.checkInDate ? new Date(b.checkInDate) : null;
          const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
          if (!ci || !co) return false;
          if (ss && ee) return ci.getTime() <= ee.getTime() && co.getTime() > ss.getTime();
          if (ss && !ee) return co.getTime() > ss.getTime();
          if (!ss && ee) return ci.getTime() <= ee.getTime();
          return true;
        });
      }

      // sort: pending/issued first then recent
      refunds = refunds.sort((a, b) => {
        const statusA = (a.refundStatus || 'none').toLowerCase();
        const statusB = (b.refundStatus || 'none').toLowerCase();
        if (statusA === 'pending' && statusB !== 'pending') return -1;
        if (statusA !== 'pending' && statusB === 'pending') return 1;
        if (statusA === 'issued' && statusB !== 'issued' && statusB !== 'pending') return -1;
        if (statusA !== 'issued' && statusB === 'issued' && statusA !== 'pending') return 1;
        const timeA = a.refundedAt ? new Date(a.refundedAt).getTime() : (a.cancelledAt ? new Date(a.cancelledAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        const timeB = b.refundedAt ? new Date(b.refundedAt).getTime() : (b.cancelledAt ? new Date(b.cancelledAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
        return timeB - timeA;
      });

      // Client-side pagination for refunds
      const tot = refunds.length;
      const startIdx = (p - 1) * limit;
      const pageItems = refunds.slice(startIdx, startIdx + limit);

      setData(pageItems);
      setTotal(tot);
      setPage(p);
    } catch (err) {
      console.error('Failed to load admin refunds', err);
      setData([]);
      setTotal(0);
    } finally { setLoading(false); }
  };

  useEffect(()=>{
    (async ()=>{
      try {
        const [hRes, oRes] = await Promise.all([
          adminService.getHotels({ page:1, limit: 1000 }),
          adminService.getOwners({ page:1, limit: 1000 })
        ]);
        const all = hRes.data || [];
        setAllHotels(all);
        setHotels(all);
        setOwners(oRes.data || []);
        setSelectedHotel('');
        setSelectedOwner('');
        // initial load
        load(1, { hotels: all });
      } catch (err) { console.warn('Failed to load hotels/owners', err); load(1); }
    })();
  }, []);

  // when owner changes, fetch owner hotels
  useEffect(()=>{
    (async ()=>{
      if (!selectedOwner) {
        setHotels(allHotels);
        load(1, { hotels: allHotels, selectedOwner: '' });
        return;
      }
      try {
        const r = await adminService.getOwnerHotels(selectedOwner);
        const ownerList = r && r.data ? r.data : [];
        const merged = (ownerList || []).map(h => {
          const id = h._id || h.id;
          const full = (allHotels || []).find(x => (x._id || x.id) === id) || {};
          return { _id: id, name: full.name || h.name || id, status: h.status };
        });
        setHotels(merged);
        setSelectedHotel('');
        load(1, { hotels: merged, selectedOwner });
      } catch (err) {
        console.warn('Failed to load owner hotels', err);
        setHotels([]);
        load(1, { hotels: [], selectedOwner });
      }
    })();
  }, [selectedOwner]);

  const issueRefund = async (bookingId) => {
    if (!bookingId) return;
    try {
      setLoading(true);
      await adminService.issueRefund(bookingId);
      // reload current page
      await load(page);
      alert('Refund issued successfully');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to issue refund';
      alert(msg);
    } finally { setLoading(false); }
  };

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Refunds">
      <div className="bg-linear-to-r from-blue-600 to-red-600 bg-clip-text text-transparent font-bold mb-4 text-2xl">Admin Refunds</div>

      <FilterControls
        start={start}
        end={end}
        field={field}
        selectedHotel={selectedHotel}
        hotels={Array.isArray(owners) && owners.length > 0 && !selectedOwner ? [] : hotels}
        owners={owners}
        selectedOwner={selectedOwner}
        onChangeStart={(v) => { setStart(v); load(1, { start: v }); }}
        onChangeEnd={(v) => { setEnd(v); load(1, { end: v }); }}
        onChangeField={(v) => { setField(v); load(1, { field: v }); }}
        onChangeSelectedHotel={(v) => { setSelectedHotel(v); load(1, { selectedHotel: v }); }}
        onChangeSelectedOwner={(v) => { setSelectedOwner(v); setSelectedHotel(''); load(1, { selectedOwner: v, selectedHotel: '', hotels: v ? [] : allHotels }); }}
        onReset={() => { setStart(''); setEnd(''); setField('created'); setSelectedHotel(''); setSelectedOwner(''); load(1, { start: '', end: '', field: 'created', selectedHotel: '', selectedOwner: '' }); }}
        onFilter={() => load(1)}
      />

      {loading ? (
        <div className="flex justify-center py-10"><Spinner label="Loading refunds..." /></div>
      ) : data.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No refunds found.</div>
      ) : (
        <div className="space-y-3">
          <div className="hidden md:block bg-white rounded-2xl shadow-lg">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="bg-linear-to-r from-blue-50 to-red-50 border-b-2 border-blue-200">
                  <th className="py-4 px-6 font-semibold text-gray-700">User</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Refunded On</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Total</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Refund Amount</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
            </table>

            <div className="max-h-[45vh] overflow-auto scrollbar-custom">
              <table className="w-full table-fixed">
                <tbody>
                  {data?.map(b => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-medium text-gray-800">{b.user?.name || b.user?.username || b.paymentDetails?.guestName || '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.hotel?.name || b.hotelName || '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.refundedAt ? formatDateTime(b.refundedAt) : '-'}</td>
                      <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                      <td className="py-4 px-6 font-semibold text-teal-600">{b.refundAmount ? formatINR(Number(b.refundAmount)) : '-'}</td>
                      <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                        (b.refundStatus || 'none') === 'completed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                        (b.refundStatus || 'none') === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}</span></td>
                      <td className="py-4 px-6">
                        {b.refundStatus === 'pending' ? (
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm" onClick={()=>issueRefund(b._id)}>Issue Refund</button>
                        ) : (
                          <div className="text-xs text-gray-500">-</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p)} className="mt-6" />
    </Layout>
  );
}
