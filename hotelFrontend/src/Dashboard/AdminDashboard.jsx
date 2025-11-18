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
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-2">Users</div>
                <div className="text-3xl font-bold">{counts.users}</div>
              </div>
              <div className="text-5xl opacity-80">👥</div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-400">
              <Link to="/dashboard/admin/users" className="text-sm text-blue-100 hover:text-white transition-colors duration-200 flex items-center gap-1">
                Manage users <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-sm font-medium mb-2">Hotel Owners</div>
                <div className="text-3xl font-bold">{counts.owners}</div>
              </div>
              <div className="text-5xl opacity-80">🏨</div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-400">
              <Link to="/dashboard/admin/owners" className="text-sm text-purple-100 hover:text-white transition-colors duration-200 flex items-center gap-1">
                Manage owners <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-sm font-medium mb-2">Bookings</div>
                <div className="text-3xl font-bold">{counts.bookings}</div>
              </div>
              <div className="text-5xl opacity-80">📅</div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-400">
              <Link to="/dashboard/admin/bookings" className="text-sm text-green-100 hover:text-white transition-colors duration-200 flex items-center gap-1">
                View bookings <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-sm font-medium mb-2">Pending Refunds</div>
                <div className="text-3xl font-bold">{counts.pendingRefunds}</div>
              </div>
              <div className="text-5xl opacity-80">💰</div>
            </div>
            <div className="mt-4 pt-4 border-t border-orange-400">
              <Link to="/dashboard/admin/refunds" className="text-sm text-orange-100 hover:text-white transition-colors duration-200 flex items-center gap-1">
                Manage refunds <span>→</span>
              </Link>
            </div>
          </div>
        </div>

     
      </div>
    </Layout>
  );
};

export default AdminDashboard;
