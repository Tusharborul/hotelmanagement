import React, { useEffect, useState } from 'react';
import FilterControls from '../components/FilterControls';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import Pagination from '../../components/Pagination';
import { formatDateTime } from '../../utils/date';
import { formatINR } from '../../utils/currency';

export default function AdminBookingDetails() {
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

  // load supports overrides so callers can trigger filtering immediately
  const load = async (p = 1, overrides = {}) => {
    const s = overrides.start !== undefined ? overrides.start : start;
    const e = overrides.end !== undefined ? overrides.end : end;
    const sel = overrides.selectedHotel !== undefined ? overrides.selectedHotel : selectedHotel;
    const f = overrides.field !== undefined ? overrides.field : field;
    const hotelsList = overrides.hotels !== undefined ? overrides.hotels : hotels;

    // If the user asked to filter by 'checkin' we want occupancy-overlap semantics
    // (bookings that overlap the selected range). The server's `field=checkin`
    // parameter performs a strict checkInDate range filter, so request without
    // that server-side filter and apply occupancy filtering client-side below.
    const apiParams = { page: p, limit };
    if (f !== 'checkin') {
      if (s) apiParams.start = s;
      if (e) apiParams.end = e;
      if (f === 'checkin') apiParams.field = 'checkin'; // unreachable but explicit
    }
    const res = await adminService.getBookings(apiParams);
    let items = res.data || [];

    // client-side hotel filter: if selectedHotel is empty -> all hotels
    if (sel) {
      items = (items || []).filter(b => (b.hotel && (b.hotel._id || b.hotel.id) === sel) || b.hotelId === sel);
    }

    // If an owner is selected and no specific hotel is selected, filter bookings to hotels owned by that owner
    const selOwner = overrides.selectedOwner !== undefined ? overrides.selectedOwner : selectedOwner;
    if (selOwner && !sel) {
      const ownerHotelIds = (hotelsList || []).map(h => h._id || h.id);
      items = (items || []).filter(b => {
        const hid = (b.hotel && (b.hotel._id || b.hotel.id)) || b.hotelId;
        return ownerHotelIds.includes(hid);
      });
    }

    // Client-side fallback: if 'checkin' filter selected, ensure we filter by booking.checkInDate
    if (f === 'checkin' && (s || e)) {
      const ss = s ? new Date(s) : null;
      const ee = e ? (() => { const d = new Date(e); d.setHours(23,59,59,999); return d; })() : null;
      items = (items || []).filter(b => {
        const ci = b.checkInDate ? new Date(b.checkInDate) : null;
        const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
        if (!ci || !co) return false;
        // overlap if ci <= ee && co > ss
        if (ss && ee) return ci.getTime() <= ee.getTime() && co.getTime() > ss.getTime();
        if (ss && !ee) return co.getTime() > ss.getTime();
        if (!ss && ee) return ci.getTime() <= ee.getTime();
        return true;
      });
    }

    setData(items);
    // If we performed client-side filtering, update total to the filtered count so pagination reflects results
    setTotal((f === 'checkin' && (s || e)) ? items.length : (sel ? items.length : res.total));
    setPage(res.page);
  };

  // initial load
  useEffect(()=>{ load(1); }, []);

  const onReset = () => {
    // clear state and trigger load with overrides so API call uses cleared values immediately
    setStart('');
    setEnd('');
    setField('created');
    setSelectedHotel('');
    setSelectedOwner('');
    load(1, { start: '', end: '', field: 'created', selectedHotel: '', selectedOwner: '' });
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
        setHotels(all); // default to all hotels until an owner is selected
        setOwners(oRes.data || []);
        // default to All Hotels / All Owners
        setSelectedHotel('');
        setSelectedOwner('');
      } catch (err) { console.warn('Failed to load hotels or owners', err); }
    })();
  }, []);

  // when owner changes, if selectedOwner is set fetch owner's hotels; otherwise reset to all hotels
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
        // merge with allHotels to ensure hotel name is available (owner endpoint returns minimal fields)
        const merged = (ownerList || []).map(h => {
          const id = h._id || h.id;
          const full = (allHotels || []).find(x => (x._id || x.id) === id) || {};
          return { _id: id, name: full.name || h.name || id, status: h.status };
        });
        setHotels(merged);
        // when switching owner, clear selected hotel
        setSelectedHotel('');
        // reload bookings filtered to this owner's hotels
        load(1, { hotels: merged, selectedOwner });
      } catch (err) {
        console.warn('Failed to load owner hotels', err);
        setHotels([]);
        load(1, { hotels: [], selectedOwner });
      }
    })();
  }, [selectedOwner]);



  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Booking Details">
        <div className="bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Booking Details</div>
      
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
          onReset={onReset}
          onFilter={() => load(1)}
        />

        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {data?.map(b => (
              <div key={b._id} className="border-2 border-orange-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-orange-300 transition-all duration-300">
                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-gray-500">User:</span>
                    <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm h-fit ${
                    b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' : 
                    b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' : 
                    'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Hotel:</span>
                  <div className="text-sm">{b.hotel?.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">Check-in:</span>
                    <div className="text-sm">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Days:</span>
                    <div className="text-sm">{b.days}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Total:</span>
                    <div className="text-sm font-semibold">{formatINR(b.totalPrice)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created:</span>
                    <div className="text-sm">{formatDateTime(b.createdAt)}</div>
                  </div>
                </div>
                {b.refundStatus && b.refundStatus !== 'none' && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-medium">Refund:</span>
                    <span className="text-xs ml-2 px-3 py-1 rounded-lg bg-linear-to-r from-blue-400 to-blue-500 text-white font-semibold shadow-sm">{b.refundStatus}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-linear-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                  <th className="py-4 px-6 font-semibold text-gray-700">User</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                   <th className="py-4 px-6 font-semibold text-gray-700">Created</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Days</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Total</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                 
                </tr>
              </thead>
              <tbody>
                {data?.map(b => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors duration-200">
                    <td className="py-4 px-6 text-gray-800 font-medium">{b.user?.name || b.user?.username}</td>
                    <td className="py-4 px-6 text-gray-600">{b.hotel?.name}</td>
                     <td className="py-4 px-6 text-gray-600">{formatDateTime(b.createdAt)}</td>
                    <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{b.days}</td>
                    <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                    <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
                      b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' : 
                      b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' : 
                      'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                    }`}>{b.status}</span>{b.refundStatus && b.refundStatus !== 'none' ? <span className="ml-2 px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700 font-semibold">{b.refundStatus}</span> : ''}</td>
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p)} className="mt-6" />
   
    </Layout>
  );
}
