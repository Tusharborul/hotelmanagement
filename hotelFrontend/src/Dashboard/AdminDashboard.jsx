import React, { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import Layout from "./components/Layout";
import { adminService } from "../services/adminService";

const AdminDashboard = () => {
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [counts, setCounts] = useState({ users: 0, owners: 0, bookings: 0, pendingRefunds: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      try {
  // users: request minimal page but read total from response
  // count only role='user' so dashboard 'Users' matches the users list view
  const usersRes = await adminService.getUsers({ role: 'user', page: 1, limit: 1 });
        const ownersRes = await adminService.getOwners({ page: 1, limit: 1 });
        const bookingsRes = await adminService.getBookings({ page: 1, limit: 20 });

        const usersTotal = usersRes?.total || (Array.isArray(usersRes?.data) ? usersRes.data.length : 0);
        const ownersTotal = ownersRes?.total || (Array.isArray(ownersRes?.data) ? ownersRes.data.length : 0);
        const bookingsTotal = bookingsRes?.total || (Array.isArray(bookingsRes?.data) ? bookingsRes.data.length : 0);

        // pending refunds count from bookings data
        const refundsList = bookingsRes?.data || [];
        const pendingRefunds = refundsList.filter(b => b.refundStatus === 'pending').length;

        if (mounted) setCounts({ users: usersTotal, owners: ownersTotal, bookings: bookingsTotal, pendingRefunds });
      } catch (err) {
        console.error('Failed to load admin summary', err);
      }
    };

    const loadOwners = async () => {
      try {
        const res = await adminService.getOwners({ page: 1, limit: 6 });
        const list = res?.data || res || [];
        if (mounted) setOwners(list.slice(0,6));
      } catch (err) {
        console.error('Failed to load owners', err);
      } finally {
        if (mounted) setLoadingOwners(false);
      }
    }

    loadSummary();
    loadOwners();

    return () => { mounted = false; };
  }, []);

  return (
    <Layout role="admin" title="Hello, Admin" subtitle="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-linear-to-r from-white to-gray-50 border rounded-lg shadow-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Users</div>
                <div className="text-2xl font-bold">{counts.users}</div>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="mt-3">
              <Link to="/dashboard/admin/users" className="text-sm text-blue-600">Manage users →</Link>
            </div>
          </div>

          <div className="bg-linear-to-r from-white to-gray-50 border rounded-lg shadow-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Hotel Owners</div>
                <div className="text-2xl font-bold">{counts.owners}</div>
              </div>
              <div className="text-3xl">🏨</div>
            </div>
            <div className="mt-3">
              <Link to="/dashboard/admin/owners" className="text-sm text-blue-600">Manage owners →</Link>
            </div>
          </div>

          <div className="bg-linear-to-r from-white to-gray-50 border rounded-lg shadow-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Bookings</div>
                <div className="text-2xl font-bold">{counts.bookings}</div>
              </div>
              <div className="text-3xl">📅</div>
            </div>
            <div className="mt-3">
              <Link to="/dashboard/admin/bookings" className="text-sm text-blue-600">View bookings →</Link>
            </div>
          </div>

          <div className="bg-linear-to-r from-white to-gray-50 border rounded-lg shadow-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Refunds</div>
                <div className="text-2xl font-bold">{counts.pendingRefunds}</div>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <div className="mt-3">
              <Link to="/dashboard/admin/refunds" className="text-sm text-blue-600">Manage refunds →</Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Recent Hotel Owners</div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard/admin/owners')} className="text-sm text-blue-600">View all</button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {loadingOwners ? (
              <div className="text-gray-500 col-span-full">Loading owners...</div>
            ) : owners.length === 0 ? (
              <div className="text-gray-500 col-span-full">No owners found.</div>
            ) : (
              owners.map((o) => (
                <div key={o._id || o.id || o.email} className="flex items-center gap-4 p-3 border rounded">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-lg">
                    {((o.name || o.fullName || o.email || '').trim().split(' ').map(s=>s[0]).slice(0,2).join('')) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{o.name || o.fullName || o.email}</div>
                    <div className="text-xs text-gray-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="text-sm">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded">{o.role || 'Owner'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
