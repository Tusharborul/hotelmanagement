
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';

export default function OwnerRefunds() {
	const [hotels, setHotels] = useState([]);
	const [selected, setSelected] = useState('');
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);

	const loadHotels = async () => {
		try {
			const res = await hotelService.getMyHotels();
			const list = res.data || [];
			setHotels(list);
			if (!selected && list[0]?._id) setSelected(list[0]._id);
		} catch (err) {
			console.error('Failed to load hotels', err);
		}
	};

	const loadRefunds = async (hotelId) => {
		if (!hotelId) return setData([]);
		setLoading(true);
		try {
			const res = await bookingService.getHotelBookings(hotelId);
			const list = Array.isArray(res) ? res : (res?.data || []);
			const refunds = list.filter(b => Number(b.refundAmount || 0) > 0 || (b.refundStatus && b.refundStatus !== 'none'));
			setData(refunds);
		} catch (err) {
			console.error('Failed to load refunds for hotel', err);
			setData([]);
		} finally { setLoading(false); }
	};

	useEffect(()=>{ loadHotels(); }, []);
	useEffect(()=>{ if (selected) loadRefunds(selected); }, [selected]);

	return (
		<Layout role="owner" title="Hello, Owner" subtitle="Refunds">
			<div className="bg-white rounded-lg shadow p-4 md:p-6">
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
					<div className="w-full sm:w-auto">
						<label className="text-sm text-gray-600 block mb-1">Hotel</label>
						<select  name="selected" value={selected} onChange={(e)=>setSelected(e.target.value)} className="border rounded px-3 py-2 w-full sm:w-64 lg:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
							<option value="">Select a hotel</option>
							{hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
						</select>
					</div>
				</div>

				{loading ? (
					<div className="text-gray-500">Loading refunds...</div>
				) : data.length === 0 ? (
					<div className="text-gray-500">No refunds for this hotel.</div>
				) : (
					<div className="space-y-3">
						{/* Mobile card view */}
						<div className="block md:hidden space-y-3">
							{data.map(b => (
								<div key={b._id} className="border rounded-lg p-3 space-y-2">
									<div className="flex justify-between items-start">
										<div>
											<span className="text-xs text-gray-500">User:</span>
											<div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
										</div>
										<span className={`text-xs px-2 py-1 rounded ${
											b.refundStatus === 'completed' ? 'bg-green-100 text-green-700' :
											b.refundStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
											'bg-gray-100 text-gray-700'
										}`}>
											{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
										</span>
									</div>

									<div>
										<span className="text-xs text-gray-500">Check-in:</span>
										<div className="text-sm">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}</div>
									</div>

									<div className="grid grid-cols-2 gap-2">
										<div>
											<span className="text-xs text-gray-500">Total:</span>
											<div className="text-sm font-semibold">${b.totalPrice}</div>
										</div>
										<div>
											<span className="text-xs text-gray-500">Refund Amount:</span>
											<div className="text-sm font-semibold text-blue-600">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</div>
										</div>
									</div>

									{b.refundedAt && (
										<div>
											<span className="text-xs text-gray-500">Refunded:</span>
											<div className="text-sm">{new Date(b.refundedAt).toLocaleDateString()}</div>
										</div>
									)}
								</div>
							))}
						</div>

						{/* Desktop table view */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="border-b">
										<th className="py-2">User</th>
										<th className="py-2">Check-in</th>
										<th className="py-2">Total</th>
										<th className="py-2">Refund Amount</th>
										<th className="py-2">Refund Status</th>
										<th className="py-2">Refunded On</th>
									</tr>
								</thead>
								<tbody>
									{data.map(b => (
										<tr key={b._id} className="border-b">
											<td className="py-2">{b.user?.name || b.user?.username}</td>
											<td className="py-2">{b.checkInDate ? new Date(b.checkInDate).toLocaleString() : '-'}</td>
											<td className="py-2">${b.totalPrice}</td>
											<td className="py-2">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</td>
											<td className="py-2">{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}</td>
											<td className="py-2">{b.refundedAt ? new Date(b.refundedAt).toLocaleString() : '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
}
