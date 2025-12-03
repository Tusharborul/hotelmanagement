import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';
import FilterControls from '../components/FilterControls';
import { formatDateTime } from '../../utils/date';
import Pagination from '../../components/Pagination';
import { formatINR } from '../../utils/currency';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Spinner from '../../components/Spinner';

export default function OwnerBookings() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [field, setField] = useState('created');
  const [bookings, setBookings] = useState([]);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await hotelService.getMyHotels();
        const list = res?.data || [];
        setHotels(list);
        // if no hotels, stop loading so empty state can show
        if (!list || list.length === 0) setLoading(false);
      } catch (err) {
        console.error('Failed to load hotels', err);
        setHotels([]);
        setLoading(false);
      }
    })();
  }, []);

  // Initial load when hotels list changes. Subsequent filter changes are applied immediately
  // via `applyFilter` called from onChange handlers to avoid waiting for setState.
  useEffect(() => {
    (async () => {
      if (!hotels || hotels.length === 0) return;
      await applyFilter();
    })();
  }, [hotels]);

  // helper to filter list by start/end and field (created or checkin)
  const filterByRange = (list, s, e, f) => {
    if (!s && !e) return list;
    try {
      const ss = s ? new Date(s) : null;
      const ee = e ? (() => { const d = new Date(e); d.setHours(23, 59, 59, 999); return d; })() : null;
      return (list || []).filter(b => {
        if (f === 'checkin') {
          // Treat the filter range as an occupancy window and include bookings
          // that overlap the selected range: booking.checkInDate <= ee && booking.checkOutDate > ss
          const ci = b.checkInDate ? new Date(b.checkInDate) : null;
          const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
          if (!ci || !co) return false;
          // normalize
          if (ss) ss.setHours(0, 0, 0, 0);
          if (ee) ee.setHours(23, 59, 59, 999);
          if (ss && ee) {
            return ci.getTime() <= ee.getTime() && co.getTime() > ss.getTime();
          }
          if (ss && !ee) {
            return co.getTime() > ss.getTime();
          }
          if (!ss && ee) {
            return ci.getTime() <= ee.getTime();
          }
          return true;
        }
        const val = b.createdAt;
        if (!val) return false;
        const d = new Date(val);
        if (ss && d < ss) return false;
        if (ee && d > ee) return false;
        return true;
      });
    } catch (err) {
      return list;
    }
  };

  // provide a manual filter action (accepts overrides for immediate filtering)
  const applyFilter = async (overrides = {}) => {
    setLoading(true);
    try {
      const sel = overrides.selected !== undefined ? overrides.selected : selected;
      const s = overrides.start !== undefined ? overrides.start : start;
      const e = overrides.end !== undefined ? overrides.end : end;
      const f = overrides.field !== undefined ? overrides.field : field;
      const p = overrides.page !== undefined ? overrides.page : 1;

      if (sel) {
        try {
          const r = await bookingService.getHotelBookings(sel);
          const list = Array.isArray(r) ? r : (r?.data || []);
          const hotelMeta = (hotels || []).find(h => h._id === sel) || { _id: sel, name: '' };
          let mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: hotelMeta._id, name: hotelMeta.name }, hotelName: (b.hotel && b.hotel.name) || hotelMeta.name }));
          // Sort by createdAt descending (most recent first)
          mapped = mapped.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          const filtered = filterByRange(mapped, s, e, f);
          const tot = filtered.length;
          const startIdx = (p - 1) * limit;
          const pageItems = filtered.slice(startIdx, startIdx + limit);
          setBookings(pageItems);
          setTotal(tot);
          setPage(p);
        } catch (err) { console.error(err); }
      } else {
        const all = [];
        for (const h of (hotels || [])) {
          try {
            const r = await bookingService.getHotelBookings(h._id);
            const list = Array.isArray(r) ? r : (r?.data || []);
            const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: h._id, name: h.name }, hotelName: (b.hotel && b.hotel.name) || h.name }));
            all.push(...mapped);
          } catch (err) { /* ignore per-hotel errors */ }
        }
        // Sort by createdAt descending (most recent first)
        all.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        const filtered = filterByRange(all, s, e, f);
        const tot = filtered.length;
        const startIdx = (p - 1) * limit;
        const pageItems = filtered.slice(startIdx, startIdx + limit);
        setBookings(pageItems);
        setTotal(tot);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => { setDate(''); setStart(''); setEnd(''); setField('created'); setSelected(''); applyFilter({ start: '', end: '', field: 'created', selected: '' }); };

  const openOfflineModal = () => {
    setOfflineForm(f => ({ ...f, hotel: selected || (hotels[0]?._id || '') }));
    setShowOfflineModal(true);
  };

  // Recalculate estimated total when hotel or days change
  useEffect(() => {
    try {
      const h = (hotels || []).find(x => x._id === offlineForm.hotel);
      // choose base rate: prefer AC if both exist? Require selection? For offline quick booking, use Non-AC if only non-ac else ac.
      const baseRate = h ? (h.priceNonAc ? Number(h.priceNonAc) : (h.priceAc ? Number(h.priceAc) : 0)) : 0;
      const d = Number(offlineForm.days) || 1;
      setRatePerNight(baseRate);
      setEstimatedTotal(baseRate * d);
    } catch (_) {
      setRatePerNight(0);
      setEstimatedTotal(0);
    }
  }, [offlineForm.hotel, offlineForm.days, hotels]);

  const submitOffline = async (e) => {
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
      const res = await bookingService.createOfflineBooking({
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
      // refresh current view
      await applyFilter({ selected: selected });
    } catch (err) {
      console.error('Failed to create offline booking', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message;
      if (status === 409 && message) {
        const lower = message.toLowerCase();
        const dupErrs = {};
        if (lower.includes('email')) dupErrs.guestEmail = message;
        if (lower.includes('username')) dupErrs.guestUsername = message;
        setOfflineErrors(prev => ({ ...prev, ...dupErrs }));
      } else if (status === 400 && message) {
        // Show server-side validation messages inline where possible
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
  };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Bookings">
      <div className='grid grid-cols-1 md:grid-cols-2 justify-between items-center md:gap-4'>
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Bookings Management</div>
      <div className="mb-2 md:mb-4 flex md:justify-end">
        <button className="px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg w-full sm:w-auto" onClick={openOfflineModal} disabled={hotels.length === 0}>
          Add Booking
        </button>
      </div>
      </div>
      <div className="mb-6">
        <FilterControls
          start={start}
          end={end}
          field={field}
          selectedHotel={selected}
          hotels={hotels}
          onChangeStart={(v) => { setStart(v); applyFilter({ start: v, page: 1 }); }}
          onChangeEnd={(v) => { setEnd(v); applyFilter({ end: v, page: 1 }); }}
          onChangeField={(v) => { setField(v); applyFilter({ field: v, page: 1 }); }}
          onChangeSelectedHotel={(v) => { setSelected(v); applyFilter({ selected: v, page: 1 }); }}
          onReset={clearFilter}
          onFilter={() => applyFilter()}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner label="Loading bookings..." /></div>
      ) : (
        <div className="space-y-3">
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {bookings.map(b => (
              <div key={b._id} className="border-2 border-blue-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                <div>
                  <span className="text-xs text-gray-500">User:</span>
                  <div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Hotel:</span>
                  <div className="text-sm">{b.hotel?.name || b.hotelName || '-'}</div>
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
                    <span className="text-xs text-gray-500">Status:</span>
                    <div>
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                          b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                            'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                        }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg">
            {/* Header table */}
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="bg-linear-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <th className="py-4 px-6 font-semibold text-gray-700">User</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Days</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Total</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Room</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
            </table>

            {/* Scrollable body */}
            <div className="max-h-[45vh] overflow-auto scrollbar-custom">
              <table className="w-full table-fixed">
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-medium text-gray-800">{b.user?.name || b.user?.username || b.paymentDetails?.guestName || '-'}{b.offlineCash ? <span className="ml-2 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Cash</span> : null}</td>
                      <td className="py-4 px-6 text-gray-600">{b.hotel?.name || b.hotelName || '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{b.days}</td>
                      <td className="py-4 px-6 font-semibold text-green-600">{formatINR(b.totalPrice)}</td>
                      <td className="py-4 px-6 text-gray-600">{b.roomNumber ? `${b.roomNumber}` : '-'} {b.roomType ? `(${b.roomType})` : ''}</td>
                      <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${b.status === 'confirmed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                          b.status === 'cancelled' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                            'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                        }`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      
        <Pagination page={page} total={total} limit={limit} onPageChange={(p) => applyFilter({ page: p })} className="mt-6" />
      

      <Modal title="Add Offline Booking (Cash)" open={showOfflineModal} onClose={() => setShowOfflineModal(false)} size="md">
        <form onSubmit={submitOffline} className="space-y-3">
          {/* Amount summary */}
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
                id="owner-offline-hotel"
                name="hotel"
                value={offlineForm.hotel}
                onChange={(v) => setOfflineForm(f => ({ ...f, hotel: v }))}
                options={[{ value: '', label: 'Select a hotel' }, ...(hotels || []).map(h => ({ value: h._id, label: `${h.name}${h.location ? ` - ${h.location}` : ''}` }))]}
                placeholder={null}
              />
              {offlineErrors.hotel && <div className="text-xs text-red-600 mt-1">{offlineErrors.hotel}</div>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Check-in</label>
              <input type="date" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="checkInDate" value={offlineForm.checkInDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setOfflineForm(f => ({ ...f, checkInDate: e.target.value }))} required />
              {offlineErrors.checkInDate && <div className="text-xs text-red-600 mt-1">{offlineErrors.checkInDate}</div>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">Days</label>
              <input type="number" min="1" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="days" value={offlineForm.days} onChange={(e) => setOfflineForm(f => ({ ...f, days: e.target.value }))} required />
              {offlineErrors.days && <div className="text-xs text-red-600 mt-1">{offlineErrors.days}</div>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Guest Name</label>
              <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestName" value={offlineForm.guestName} onChange={(e) => setOfflineForm(f => ({ ...f, guestName: e.target.value }))} />
              {offlineErrors.guestName && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestName}</div>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">Guest Email</label>
              <input type="email" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestEmail" value={offlineForm.guestEmail} onChange={(e) => setOfflineForm(f => ({ ...f, guestEmail: e.target.value }))} />
              {offlineErrors.guestEmail && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestEmail}</div>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Country</label>
              <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestCountry" value={offlineForm.guestCountry} onChange={(e) => setOfflineForm(f => ({ ...f, guestCountry: e.target.value }))} />
              {offlineErrors.guestCountry && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestCountry}</div>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">Country Code</label>
              <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestCountryCode" value={offlineForm.guestCountryCode} onChange={(e) => setOfflineForm(f => ({ ...f, guestCountryCode: e.target.value }))} />
              {offlineErrors.guestCountryCode && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestCountryCode}</div>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Username</label>
              <input type="text" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestUsername" value={offlineForm.guestUsername} onChange={(e) => setOfflineForm(f => ({ ...f, guestUsername: e.target.value }))} />
              {offlineErrors.guestUsername && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestUsername}</div>}
            </div>
          </div>
          <div>
              <label className="text-sm font-semibold text-gray-700">Guest Phone</label>
            <input type="tel" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestPhone" value={offlineForm.guestPhone} onChange={(e) => setOfflineForm(f => ({ ...f, guestPhone: e.target.value }))} />
            {offlineErrors.guestPhone && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestPhone}</div>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <input type="password" className="border-2 border-blue-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors duration-300" name="guestPassword" value={offlineForm.guestPassword} onChange={(e) => setOfflineForm(f => ({ ...f, guestPassword: e.target.value }))} />
            {offlineErrors.guestPassword && <div className="text-xs text-red-600 mt-1">{offlineErrors.guestPassword}</div>}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2 bg-linear-to-r from-green-500 to-green-600 text-white rounded-full shadow-md hover:scale-105 transition-transform">Save</button>
            <button type="button" className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition" onClick={() => setShowOfflineModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>


    </Layout>
  );
}
