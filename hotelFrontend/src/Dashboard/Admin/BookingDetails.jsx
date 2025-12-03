import React, { useEffect, useState } from 'react';
import FilterControls from '../components/FilterControls';
import Layout from '../components/Layout';
import { adminService } from '../../services/adminService';
import { bookingService } from '../../services/bookingService';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/date';
import { formatINR } from '../../utils/currency';
import Modal from '../../components/Modal';
import Select from '../../components/Select';

export default function AdminBookingDetails() {
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
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineForm, setOfflineForm] = useState({
    hotel: '',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestCountry: 'India',
    guestCountryCode: '+91',
    guestUsername: '',
    guestPassword: '',
    checkInDate: '',
    days: 1
  });
  const [offlineErrors, setOfflineErrors] = useState({});
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [ratePerNight, setRatePerNight] = useState(0);

  // load supports overrides so callers can trigger filtering immediately
  const load = async (p = 1, overrides = {}) => {
    setLoading(true);
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
    // Sort by createdAt descending (most recent first)
    items = [...items].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

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
    setLoading(false);
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
        // immediately load bookings now that we have hotels available
        load(1, { hotels: all });
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

  // Recalculate estimated total when hotel or days change (type-based pricing)
  useEffect(() => {
    try {
      const h = (allHotels || []).find(x => (x._id || x.id) === offlineForm.hotel);
      const baseRate = h ? (h.priceNonAc ? Number(h.priceNonAc) : (h.priceAc ? Number(h.priceAc) : 0)) : 0;
      const d = Number(offlineForm.days) || 1;
      setRatePerNight(baseRate);
      setEstimatedTotal(baseRate * d);
    } catch (_) {
      setRatePerNight(0);
      setEstimatedTotal(0);
    }
  }, [offlineForm.hotel, offlineForm.days, allHotels]);



  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Booking Details">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-between md:gap-4">
  <div className="bg-linear-to-r from-blue-600 to-red-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">
    Booking Details
  </div>

  <div className="mb-4 md:mb-0 flex md:justify-end">
    <button
      className="px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg w-full sm:w-auto"
      onClick={() => {
        setOfflineForm(f => ({
          ...f,
          hotel: selectedHotel || (allHotels[0]?._id || allHotels[0]?.id || ''),
        }));
        setShowOfflineModal(true);
      }}
      disabled={allHotels.length === 0}
    >
      Add Booking
    </button>
  </div>
</div>

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

        {loading ? (
          <div className="flex justify-center py-10"><Spinner label="Loading bookings..." /></div>
        ) : (
        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {data?.map(b => (
              <div key={b._id} className="border-2 border-blue-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
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
          <div className="hidden md:block bg-white rounded-2xl shadow-lg">
            {/* Header table (keeps column alignment) */}
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="bg-linear-to-r from-blue-50 to-red-50 border-b-2 border-blue-200">
                  <th className="py-4 px-6 font-semibold text-gray-700">User</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Created</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Days</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Total</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Room</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
            </table>

            {/* Scrollable body - scrollbar only appears here */}
            <div className="max-h-[45vh] overflow-auto scrollbar-custom">
              <table className="w-full table-fixed">
                <tbody>
                {data?.map(b => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                    <td className="py-4 px-6 text-gray-800 font-medium">{b.user?.name || b.user?.username || b.paymentDetails?.guestName || '-'}{b.offlineCash ? <span className="ml-2 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Cash</span> : null}</td>
                    <td className="py-4 px-6 text-gray-600">{b.hotel?.name}</td>
                    <td className="py-4 px-6 text-gray-600">{formatDateTime(b.createdAt)}</td>
                    <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{b.days}</td>
                    <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                    <td className="py-4 px-6 text-gray-600">{b.roomNumber ? `${b.roomNumber}` : '-'} {b.roomType ? `(${b.roomType})` : ''}</td>
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
        </div>
        )}

       
          <Pagination page={page} total={total} limit={limit} onPageChange={(p)=>load(p)} className="mt-6" />
        
        <Modal title="Add Offline Booking (Cash)" open={showOfflineModal} onClose={()=>setShowOfflineModal(false)} size="md">
          <form onSubmit={async (e)=>{
            e.preventDefault();
            const errs = {};
            if (!offlineForm.hotel) errs.hotel = 'Hotel is required';
            if (!offlineForm.checkInDate) errs.checkInDate = 'Check-in is required';
            if (!offlineForm.days || Number(offlineForm.days) < 1) errs.days = 'Days must be at least 1';
            if (!offlineForm.guestName) errs.guestName = 'Name is required';
            if (!offlineForm.guestEmail || !/^\S+@\S+\.\S+$/.test(offlineForm.guestEmail)) errs.guestEmail = 'Valid email is required';
            if (!offlineForm.guestPhone) errs.guestPhone = 'Phone is required';
            if (!offlineForm.guestCountry) errs.guestCountry = 'Country is required';
            if (!offlineForm.guestCountryCode) errs.guestCountryCode = 'Country code is required';
            if (!offlineForm.guestUsername) errs.guestUsername = 'Username is required';
            if (!offlineForm.guestPassword || offlineForm.guestPassword.length < 6) errs.guestPassword = 'Password must be at least 6 characters';
            setOfflineErrors(errs);
            if (Object.keys(errs).length) return;
            try {
              await bookingService.createOfflineBooking({
                hotel: offlineForm.hotel,
                guestName: offlineForm.guestName,
                guestPhone: offlineForm.guestPhone,
                guestEmail: offlineForm.guestEmail,
                guestCountry: offlineForm.guestCountry,
                guestCountryCode: offlineForm.guestCountryCode,
                guestUsername: offlineForm.guestUsername,
                guestPassword: offlineForm.guestPassword,
                checkInDate: offlineForm.checkInDate,
                days: Number(offlineForm.days) || 1
              });
              setShowOfflineModal(false);
              await load(page);
            } catch (err) {
              const status = err?.response?.status;
              const message = err?.response?.data?.message || err?.message;
              if (status === 409 && message) {
                const lower = message.toLowerCase();
                const dupErrs = {};
                if (lower.includes('email')) dupErrs.guestEmail = message;
                if (lower.includes('username')) dupErrs.guestUsername = message;
                setOfflineErrors(prev => ({ ...prev, ...dupErrs }));
              } else if (status === 400 && message) {
                const svErrs = {};
                if (message.toLowerCase().includes('country code')) svErrs.guestCountryCode = message;
                if (message.toLowerCase().includes('country')) svErrs.guestCountry = message;
                if (message.toLowerCase().includes('name')) svErrs.guestName = message;
                if (message.toLowerCase().includes('email')) svErrs.guestEmail = message;
                if (message.toLowerCase().includes('phone')) svErrs.guestPhone = message;
                if (message.toLowerCase().includes('username')) svErrs.guestUsername = message;
                if (message.toLowerCase().includes('password')) svErrs.guestPassword = message;
                setOfflineErrors(prev => ({ ...prev, ...svErrs }));
              } else {
                alert(message || 'Failed to create offline booking');
              }
            }
          }} className="space-y-3">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-600">Rate / night</div>
              <div className="text-sm font-semibold text-gray-800">{formatINR(ratePerNight)}</div>
            </div>
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-600">Total amount</div>
              <div className="text-sm font-semibold text-green-700">{formatINR(estimatedTotal)}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Hotel</label>
                <Select
                  id="admin-offline-hotel"
                  name="hotel"
                  value={offlineForm.hotel}
                  onChange={(v) => setOfflineForm(f => ({ ...f, hotel: v }))}
                  options={[{ value: '', label: 'Select a hotel' }, ...(allHotels || []).map(h => ({ value: (h._id || h.id), label: `${h.name}${h.location ? ` - ${h.location}` : ''}` }))]}
                  placeholder={null}
                />
                {offlineErrors.hotel && <div className="text-xs text-red-600 mt-1">{offlineErrors.hotel}</div>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Check-in</label>
                <input type="date" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="checkInDate" value={offlineForm.checkInDate} min={new Date().toISOString().split('T')[0]} onChange={(e)=>setOfflineForm(f=>({ ...f, checkInDate: e.target.value }))} required />
                {offlineErrors.checkInDate && <div className="text-xs text-red-600 mt-1">{offlineErrors.checkInDate}</div>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Days</label>
                <input type="number" min="1" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="days" value={offlineForm.days} onChange={(e)=>setOfflineForm(f=>({ ...f, days: e.target.value }))} required />
                {offlineErrors.days && <div className="text-xs text-red-600 mt-1">{offlineErrors.days}</div>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Guest Name</label>
                <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestName" value={offlineForm.guestName} onChange={(e)=>setOfflineForm(f=>({ ...f, guestName: e.target.value }))} />
                {offlineErrors.guestName && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestName}</div>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Guest Email</label>
                <input type="email" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestEmail" value={offlineForm.guestEmail} onChange={(e)=>setOfflineForm(f=>({ ...f, guestEmail: e.target.value }))} />
                {offlineErrors.guestEmail && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestEmail}</div>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Country</label>
                <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestCountry" value={offlineForm.guestCountry} onChange={(e)=>setOfflineForm(f=>({ ...f, guestCountry: e.target.value }))} />
                {offlineErrors.guestCountry && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestCountry}</div>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Country Code</label>
                <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestCountryCode" value={offlineForm.guestCountryCode} onChange={(e)=>setOfflineForm(f=>({ ...f, guestCountryCode: e.target.value }))} />
                {offlineErrors.guestCountryCode && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestCountryCode}</div>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Username</label>
                <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestUsername" value={offlineForm.guestUsername} onChange={(e)=>setOfflineForm(f=>({ ...f, guestUsername: e.target.value }))} />
                {offlineErrors.guestUsername && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestUsername}</div>}
              </div>
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-700">Guest Phone</label>
                <input type="tel" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestPhone" value={offlineForm.guestPhone} onChange={(e)=>setOfflineForm(f=>({ ...f, guestPhone: e.target.value }))} />
                {offlineErrors.guestPhone && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestPhone}</div>}
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <input type="password" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestPassword" value={offlineForm.guestPassword} onChange={(e)=>setOfflineForm(f=>({ ...f, guestPassword: e.target.value }))} />
                {offlineErrors.guestPassword && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestPassword}</div>}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-linear-to-r from-green-500 to-green-600 text-white rounded-full shadow-md hover:scale-105 transition-transform">Save</button>
              <button type="button" className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition" onClick={()=>setShowOfflineModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
   
    </Layout>
  );
}
