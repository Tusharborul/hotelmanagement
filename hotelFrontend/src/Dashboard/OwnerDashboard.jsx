import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import Layout from "./components/Layout";
import { hotelService } from "../services/hotelService";
import { bookingService } from "../services/bookingService";
import getImageUrl from '../utils/getImageUrl';
import Spinner from '../components/Spinner';
import { formatDateTime } from '../utils/date';
import { formatINR } from '../utils/currency';

const normalizeList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.hotels)) return res.hotels;
  return [];
};

const OwnerDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullToday, setFullToday] = useState({});
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [summary, setSummary] = useState({
    hotels: 0,
    bookings: 0,
    revenue: 0,
    revenueGross: 0,
    totalRefunds: 0,
    todayBookings: 0,
    todayIncome: 0
  });

  useEffect(() => {
    let mounted = true;
    const fetchHotels = async () => {
      try {
        const res = await hotelService.getMyHotels();
        const list = normalizeList(res);
        if (mounted) setHotels(list);
        // compute simple summary: total bookings and revenue across hotels
        try {
          const bookingsPerHotel = await Promise.all((list || []).map(async (h) => {
            try {
              const r = await bookingService.getHotelBookings(h._id);
              const arr = Array.isArray(r) ? r : (r?.data || []);
              return { hotelId: h._id, bookings: arr };
            } catch (e) { return { hotelId: h._id, bookings: [] }; }
          }));

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const totalBookings = bookingsPerHotel.reduce((s, p) => s + (p.bookings?.length || 0), 0);
          // Compute gross revenue, total refunds, and net revenue
          const totalGross = bookingsPerHotel.reduce((s, p) => s + (
            p.bookings?.reduce((ss, b) => ss + (Number(b.totalPrice) || 0), 0) || 0
          ), 0);

          const totalRefunds = bookingsPerHotel.reduce((s, p) => s + (
            p.bookings?.reduce((ss, b) => ss + (Number(b.refundAmount) || 0), 0) || 0
          ), 0);

          const netRevenue = Math.max(0, totalGross - totalRefunds);

          // Calculate today's bookings (bookings that occupy today) and income
          const todayBookings = bookingsPerHotel.reduce((s, p) => {
            return s + (
              (p.bookings || []).filter(b => {
                // Exclude refunded/cancelled bookings or those with a refund amount
                const status = (b.status || '').toString().toLowerCase();
                const refundedAmount = Number(b.refundAmount) || 0;
                if (status === 'cancelled' || status === 'refunded' || refundedAmount > 0) return false;

                // Prefer checkIn/checkOut range when available
                const ci = b.checkInDate ? new Date(b.checkInDate) : null;
                const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
                if (ci && co) {
                  ci.setHours(0,0,0,0); co.setHours(0,0,0,0);
                  return ci.getTime() <= today.getTime() && today.getTime() < co.getTime();
                }
                // Fallback: treat booking created today as today's booking
                if (b.createdAt) {
                  const bookingDate = new Date(b.createdAt);
                  bookingDate.setHours(0, 0, 0, 0);
                  return bookingDate.getTime() === today.getTime();
                }
                return false;
              }).length || 0
            );
          }, 0);

          // Today's income should represent revenue attributable to today —
          // i.e. sum the per-night share of bookings that include today
          // (checkInDate <= today < checkOutDate) and are confirmed/completed.
          const todayIncome = bookingsPerHotel.reduce((s, p) => {
            return s + (
              (p.bookings || [])
                .filter(b => {
                  const ci = b.checkInDate ? new Date(b.checkInDate) : null;
                  const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
                  if (!ci || !co) return false;
                  // normalize to midnight for date-only comparison
                  ci.setHours(0, 0, 0, 0);
                  co.setHours(0, 0, 0, 0);
                  const includesToday = ci.getTime() <= today.getTime() && today.getTime() < co.getTime();
                  const isRevenue = ['confirmed', 'completed'].includes((b.status || '').toString());
                  return includesToday && isRevenue;
                })
                .reduce((ss, b) => {
                  const days = Number(b.days) || (b.checkInDate && b.checkOutDate ? Math.max(1, Math.round((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (24*60*60*1000))) : 1);
                  const perNight = days > 0 ? (Number(b.totalPrice) || 0) / days : (Number(b.totalPrice) || 0);
                  return ss + perNight;
                }, 0) || 0
            );
          }, 0);

          // determine per-hotel full status for today based on dailyCapacity and confirmed bookings
          const fullMap = {};
          for (const p of bookingsPerHotel) {
            const hid = p.hotelId;
            const hotelMeta = (list || []).find(h => (h._id || h.id) === hid) || {};
            const cap = Number(hotelMeta.dailyCapacity || 0);
            if (!cap || cap <= 0) { fullMap[hid] = false; continue; }
            const overlaps = (p.bookings || []).filter(b => {
              const ci = b.checkInDate ? new Date(b.checkInDate) : null;
              const co = b.checkOutDate ? new Date(b.checkOutDate) : null;
              if (!ci || !co) return false;
              ci.setHours(0,0,0,0); co.setHours(0,0,0,0);
              const includesToday = ci.getTime() <= today.getTime() && today.getTime() < co.getTime();
              // capacity enforcement counts confirmed bookings
              return includesToday && (b.status === 'confirmed');
            }).length;
            fullMap[hid] = overlaps >= cap;
          }

          if (mounted) setFullToday(fullMap);

          if (mounted) setSummary({
            hotels: list.length,
            bookings: totalBookings,
            revenue: netRevenue,
            revenueGross: totalGross,
            totalRefunds: totalRefunds,
            todayBookings: todayBookings,
            todayIncome: todayIncome
          });
        } catch (err) {
          console.warn('Failed to compute owner summary', err);
        }
      } catch (err) {
        console.error('Failed to load owner hotels', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHotels();
    return () => { mounted = false; };
  }, []);

  // Fetch per-hotel availability for today (single-night) and store in map
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!hotels || hotels.length === 0) {
        setAvailabilityMap({});
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      // set loading flags
      const initial = {};
      hotels.forEach(h => { initial[h._id || h.id] = { loading: true }; });
      setAvailabilityMap(initial);

      const map = { ...initial };
      await Promise.all(hotels.map(async (h) => {
        try {
          const id = h._id || h.id;
          const res = await hotelService.checkAvailability(id, today, 1);
          if (res && res.success && res.data) map[id] = res.data;
          else map[id] = { error: true };
        } catch (err) {
          console.error('Owner availability fetch error', h._id || h.id, err?.message || err);
          map[h._id || h.id] = { error: true };
        }
      }));
      setAvailabilityMap(map);
    };
    fetchAvailability();
  }, [hotels]);

  return (
    <Layout role="owner" title="Hello, Hotel Owner" subtitle="Hotel Owner">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Today's Bookings */}
          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-100 text-sm font-medium">Today's Bookings</div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="text-3xl font-bold">{summary.todayBookings}</div>
            <div className="text-green-100 text-xs mt-1">Bookings today</div>
          </div>

          {/* Total Income */}
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-pink-100 text-sm font-medium">Today's Income</div>
              <div className="text-3xl">💵</div>
            </div>
            <div className="text-3xl font-bold">{formatINR(summary.todayIncome)}</div>
            <div className="text-pink-100 text-xs mt-1">Earned today</div>
          </div>

          {/* Total Revenue */}
          <div className="bg-linear-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-100 text-sm font-medium">Total Revenue</div>
              <div className="text-3xl">💰</div>
            </div>
            <div className="text-3xl font-bold">{formatINR(summary.revenue - summary.totalRefunds)}</div>
            <div className="text-blue-100 text-xs mt-1">All time earnings</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="font-bold text-xl bg-linear-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Your Properties</div>
            <div>
              <Link to="/dashboard/owner/objectives" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center gap-1">Manage objectives <span>→</span></Link>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner label="Loading properties..." /></div>
          ) : hotels.length === 0 ? (
            <div className="text-gray-500 text-center py-8">You don't have any properties yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hotels.map(h => (
                <div key={h._id || h.id} className="border-2 border-blue-100 rounded-xl p-4 flex flex-col relative hover:border-blue-300 hover:shadow-xl transition-all duration-300 bg-white">
                  {/* status badge */}
                  {h.status && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-md ${h.status === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
                          h.status === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' :
                            'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                        }`}>
                        {h.status}
                      </span>
                    </div>
                  )}
                  {/* full-today badge */}
                  {fullToday[h._id] && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="text-xs px-3 py-1.5 rounded-lg font-semibold shadow-md bg-red-500 text-white">Full Today</span>
                    </div>
                  )}

                  <div className="h-36 bg-linear-to-br from-blue-50 to-red-50 rounded-xl overflow-hidden mb-4 shadow-md relative">
                    {h.mainImage ? (
                      <img src={getImageUrl(h.mainImage)} alt={h.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}

                    {/* Availability pill (bottom-left) */}
                    <div className="absolute bottom-3 left-3 z-20">
                      {(() => {
                        const val = availabilityMap[h._id || h.id];
                        if (!val) return null;
                        if (val.loading) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700 shadow" title="Checking availability" aria-label="Checking availability">
                              <svg className="w-3 h-3 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                            </span>
                          );
                        }
                        if (val.error) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 shadow" title="Unavailable" aria-label="Unavailable">N/A</span>;
                        if (val.dailyCapacity === 0 || val.remaining === null) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-800 shadow" title="Available" aria-label="Available">Available</span>;
                        if (val.available) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 shadow" title={`${val.remaining} rooms available`} aria-label={`${val.remaining} rooms available`}>{val.remaining} rooms available</span>;
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 shadow" title="Fully booked" aria-label="Fully booked">Full</span>;
                      })()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">{h.name || h.title || 'Untitled'}</div>
                    <div className="text-sm text-gray-600 font-medium">{h.location || h.address || ''}</div>
                    <div className="mt-2 text-sm text-gray-700 line-clamp-3">{h.description ? (h.description.length > 120 ? h.description.slice(0, 120) + '...' : h.description) : '-'}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t-2 border-blue-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">Created: {h.createdAt ? formatDateTime(h.createdAt) : '-'}</div>
                    <div className="flex gap-2">
                      <Link to={`/dashboard/owner/photos?hotel=${h._id}`} className="px-3 py-1.5 border-2 border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors duration-300">Photos</Link>
                      <Link to={`/dashboard/owner/bookings?hotel=${h._id}`} className="px-3 py-1.5 border-2 border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors duration-300">Bookings</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OwnerDashboard;
