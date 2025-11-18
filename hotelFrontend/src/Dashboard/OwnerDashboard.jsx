import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import Layout from "./components/Layout";
import { hotelService } from "../services/hotelService";
import { bookingService } from "../services/bookingService";
import getImageUrl from '../utils/getImageUrl';
import { formatDateTime } from '../utils/date';

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
  const [summary, setSummary] = useState({ 
    hotels: 0, 
    bookings: 0, 
    revenue: 0,
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
          const totalRevenue = bookingsPerHotel.reduce((s, p) => s + (p.bookings?.reduce((ss, b) => ss + (Number(b.totalPrice) || 0), 0) || 0), 0);
          
          // Calculate today's bookings and income
          const todayBookings = bookingsPerHotel.reduce((s, p) => {
            return s + (p.bookings?.filter(b => {
              const bookingDate = new Date(b.createdAt);
              bookingDate.setHours(0, 0, 0, 0);
              return bookingDate.getTime() === today.getTime();
            }).length || 0);
          }, 0);
          
          // Today's income should be based on guests checking in today,
          // not the booking creation date. Consider only confirmed/completed bookings.
          const todayIncome = bookingsPerHotel.reduce((s, p) => {
            return s + (
              p.bookings?.filter(b => {
                const ci = b.checkInDate ? new Date(b.checkInDate) : null;
                if (!ci) return false;
                ci.setHours(0, 0, 0, 0);
                const isToday = ci.getTime() === today.getTime();
                const isRevenue = ['confirmed', 'completed'].includes(b.status || '');
                return isToday && isRevenue;
              }).reduce((ss, b) => ss + (Number(b.totalPrice) || 0), 0) || 0
            );
          }, 0);
          
          if (mounted) setSummary({ 
            hotels: list.length, 
            bookings: totalBookings, 
            revenue: totalRevenue,
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

          {/* Total Revenue */}
          <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-orange-100 text-sm font-medium">Total Revenue</div>
              <div className="text-3xl">💰</div>
            </div>
            <div className="text-3xl font-bold">${summary.revenue.toFixed(2)}</div>
            <div className="text-orange-100 text-xs mt-1">All time earnings</div>
          </div>

          {/* Today's Income */}
          <div className="bg-linear-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-pink-100 text-sm font-medium">Today's Income</div>
              <div className="text-3xl">💵</div>
            </div>
            <div className="text-3xl font-bold">${summary.todayIncome.toFixed(2)}</div>
            <div className="text-pink-100 text-xs mt-1">Earned today</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="font-bold text-xl bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Your Properties</div>
            <div>
              <Link to="/dashboard/owner/objectives" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center gap-1">Manage objectives <span>→</span></Link>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 text-center py-8">Loading properties...</div>
          ) : hotels.length === 0 ? (
            <div className="text-gray-500 text-center py-8">You don't have any properties yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hotels.map(h => (
                <div key={h._id || h.id} className="border-2 border-orange-100 rounded-xl p-4 flex flex-col relative hover:border-orange-300 hover:shadow-xl transition-all duration-300 bg-white">
                  {/* status badge */}
                  {h.status && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-md ${
                        h.status === 'approved' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' : 
                        h.status === 'rejected' ? 'bg-linear-to-r from-red-400 to-red-500 text-white' : 
                        'bg-linear-to-r from-yellow-400 to-yellow-500 text-white'
                      }`}>
                        {h.status}
                      </span>
                    </div>
                  )}

                  <div className="h-36 bg-linear-to-br from-orange-50 to-red-50 rounded-xl overflow-hidden mb-4 shadow-md">
                    {h.mainImage ? (
                        <img src={getImageUrl(h.mainImage)} alt={h.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">{h.name || h.title || 'Untitled'}</div>
                    <div className="text-sm text-gray-600 font-medium">{h.location || h.address || ''}</div>
                    <div className="mt-2 text-sm text-gray-700 line-clamp-3">{h.description ? (h.description.length > 120 ? h.description.slice(0,120)+'...' : h.description) : '-'}</div>
                  </div>
                    <div className="mt-4 pt-4 border-t-2 border-orange-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">Created: {h.createdAt ? formatDateTime(h.createdAt) : '-'}</div>
                    <div className="flex gap-2">
                      <Link to={`/dashboard/owner/photos?hotel=${h._id}`} className="px-3 py-1.5 border-2 border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors duration-300">Photos</Link>
                      <Link to={`/dashboard/owner/bookings?hotel=${h._id}`} className="px-3 py-1.5 border-2 border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors duration-300">Bookings</Link>
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
