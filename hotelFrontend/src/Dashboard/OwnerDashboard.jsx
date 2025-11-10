import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import Layout from "./components/Layout";
import { hotelService } from "../services/hotelService";
import { bookingService } from "../services/bookingService";
import getImageUrl from '../utils/getImageUrl';

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
  const [summary, setSummary] = useState({ hotels: 0, bookings: 0, revenue: 0 });

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
          const totalBookings = bookingsPerHotel.reduce((s, p) => s + (p.bookings?.length || 0), 0);
          const totalRevenue = bookingsPerHotel.reduce((s, p) => s + (p.bookings?.reduce((ss, b) => ss + (Number(b.totalPrice) || 0), 0) || 0), 0);
          if (mounted) setSummary({ hotels: list.length, bookings: totalBookings, revenue: totalRevenue });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Your Hotels</div>
            <div className="text-2xl font-bold">{summary.hotels}</div>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Total Bookings</div>
            <div className="text-2xl font-bold">{summary.bookings}</div>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Estimated Revenue</div>
            <div className="text-2xl font-bold">${summary.revenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Your Properties</div>
            <div>
              <Link to="/dashboard/owner/objectives" className="text-sm text-blue-600">Manage objectives →</Link>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading properties...</div>
          ) : hotels.length === 0 ? (
            <div className="text-gray-500">You don't have any properties yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hotels.map(h => (
                <div key={h._id || h.id} className="border rounded p-3 flex flex-col relative">
                  {/* status badge */}
                  {h.status && (
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs px-2 py-1 rounded ${h.status === 'approved' ? 'bg-green-100 text-green-800' : h.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {h.status}
                      </span>
                    </div>
                  )}

                  <div className="h-36 bg-gray-100 rounded overflow-hidden mb-3">
                    {h.mainImage ? (
                        <img src={getImageUrl(h.mainImage)} alt={h.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-lg">{h.name || h.title || 'Untitled'}</div>
                    <div className="text-sm text-gray-500">{h.location || h.address || ''}</div>
                    <div className="mt-2 text-sm text-gray-700">{h.description ? (h.description.length > 120 ? h.description.slice(0,120)+'...' : h.description) : '-'}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500">Created: {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '-'}</div>
                    <div className="flex gap-2">
                      <Link to={`/dashboard/owner/photos?hotel=${h._id}`} className="px-3 py-1 border rounded text-sm">Photos</Link>
                      <Link to={`/dashboard/owner/bookings?hotel=${h._id}`} className="px-3 py-1 border rounded text-sm">Bookings</Link>
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
