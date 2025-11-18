
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';
import FilterControls from '../components/FilterControls';
import { formatDateTime } from '../../utils/date';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';

export default function OwnerRefunds() {
	const [hotels, setHotels] = useState([]);
	const [selected, setSelected] = useState('');
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [field, setField] = useState('created');
	const [data, setData] = useState([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const limit = 10;
	const [loading, setLoading] = useState(false);

	const loadHotels = async () => {
		try {
			const res = await hotelService.getMyHotels();
			const list = res.data || [];
			setHotels(list);
			// default to All Hotels: do not auto-select the first hotel
		} catch (err) {
			console.error('Failed to load hotels', err);
		}
	};

	const loadRefunds = async (p = 1, overrides = {}) => {
		setLoading(true);
		try {
			const sel = overrides.selected !== undefined ? overrides.selected : selected;
			const s = overrides.start !== undefined ? overrides.start : start;
			const e = overrides.end !== undefined ? overrides.end : end;
			const f = overrides.field !== undefined ? overrides.field : field;

			// helper to check date range for createdAt or checkInDate
			const inRange = (b) => {
				if (!s && !e) return true;
				const val = f === 'checkin' ? b.checkInDate : b.createdAt;
				if (!val) return false;
				const d = new Date(val);
				const ss = s ? new Date(s) : null;
				const ee = e ? (() => { const dd = new Date(e); dd.setHours(23,59,59,999); return dd; })() : null;
				if (ss && d < ss) return false;
				if (ee && d > ee) return false;
				return true;
			};

			let all = [];
						if (sel) {
								// load selected hotel bookings and ensure name is available
								const res = await bookingService.getHotelBookings(sel);
								const list = Array.isArray(res) ? res : (res?.data || []);
								const hotelMeta = (hotels || []).find(x => x._id === sel) || {};
								all = (list || []).map(b => {
										const name = (b?.hotel && b.hotel.name) || hotelMeta.name || '';
										const hotel = (b?.hotel && typeof b.hotel === 'object')
											? { ...b.hotel, name: name || b.hotel.name }
											: { _id: sel, name };
										return { ...b, hotel, hotelName: name };
								});
						} else {
				// aggregate across owner's hotels
				for (const h of (hotels || [])) {
					try {
						const res = await bookingService.getHotelBookings(h._id);
						const list = Array.isArray(res) ? res : (res?.data || []);
										const mapped = (list || []).map(b => {
											const name = (b?.hotel && b.hotel.name) || h.name || '';
											const hotel = (b?.hotel && typeof b.hotel === 'object')
												? { ...b.hotel, name: name || b.hotel.name }
												: { _id: h._id, name };
											return { ...b, hotel, hotelName: name };
										});
						all.push(...mapped);
					} catch (err) {
						console.warn('Failed to load bookings for hotel', h._id, err);
					}
				}
			}

			// filter refunds and by range
			const refunds = (all || []).filter(b => (Number(b.refundAmount || 0) > 0 || (b.refundStatus && b.refundStatus !== 'none')) && inRange(b));

			// pagination: when aggregating (or even for single hotel), slice client-side
			const tot = refunds.length;
			const startIdx = (p - 1) * limit;
			const pageItems = refunds.slice(startIdx, startIdx + limit);

			setData(pageItems);
			setTotal(tot);
			setPage(p);
		} catch (err) {
			console.error('Failed to load refunds for hotel', err);
			setData([]);
		} finally { setLoading(false); }
	};

	useEffect(()=>{ loadHotels(); }, []);
	// when hotels load, run refunds loader (aggregated) with current filters
	useEffect(()=>{ if (hotels && hotels.length) loadRefunds(1); }, [hotels]);
	// also run when selected changes
	useEffect(()=>{ loadRefunds(1, { selected }); }, [selected]);

	return (
		<Layout role="owner" title="Hello, Owner" subtitle="Refunds">
				<div className="bg-linear-to-r from-green-600 to-teal-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Refunds Management</div>
				<div>
					<FilterControls
						start={start}
						end={end}
						field={field}
						selectedHotel={selected}
						hotels={hotels}
						onChangeStart={(v) => { setStart(v); loadRefunds(1, { start: v }); }}
						onChangeEnd={(v) => { setEnd(v); loadRefunds(1, { end: v }); }}
						onChangeField={(v) => { setField(v); loadRefunds(1, { field: v }); }}
						onChangeSelectedHotel={(v) => { setSelected(v); loadRefunds(1, { selected: v }); }}
						onReset={() => { setStart(''); setEnd(''); setField('created'); setSelected(''); loadRefunds(1, { start: '', end: '', field: 'created', selected: '' }); }}
						onFilter={() => loadRefunds(1)}
					/>
				</div>

				{loading ? (
					<div className="flex justify-center py-8"><Spinner label="Loading refunds..." /></div>
				) : data.length === 0 ? (
					<div className="text-gray-500 text-center py-8">No refunds for this hotel.</div>
				) : (
					<div className="space-y-3">
						{/* Mobile card view */}
						<div className="block md:hidden space-y-3">
							{data.map(b => (
								<div key={b._id} className="border-2 border-green-100 rounded-xl p-4 space-y-3 bg-white shadow-md hover:shadow-xl hover:border-green-300 transition-all duration-300">
									<div className="flex justify-between items-start">
										<div>
											<span className="text-xs text-gray-500">User:</span>
											<div className="font-medium text-sm">{b.user?.name || b.user?.username}</div>
										</div>
										<span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${
											b.refundStatus === 'completed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
											b.refundStatus === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' :
											'bg-gray-100 text-gray-700'
										}`}>
											{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}
										</span>
									</div>

									<div>
										<span className="text-xs text-gray-500">Hotel:</span>
										<div className="text-sm">{b.hotel?.name || b.hotelName || '-'}</div>
									</div>

									<div>
										<span className="text-xs text-gray-500">Check-in:</span>
										<div className="text-sm">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</div>
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
											<div className="text-sm">{formatDateTime(b.refundedAt)}</div>
										</div>
									)}
								</div>
							))}
						</div>

						{/* Desktop table view */}
						<div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-lg">
							<table className="w-full text-left">
								<thead>
									<tr className="bg-linear-to-r from-green-50 to-teal-50 border-b-2 border-green-200">
										<th className="py-4 px-6 font-semibold text-gray-700">User</th>
										<th className="py-4 px-6 font-semibold text-gray-700">Hotel</th>
										<th className="py-4 px-6 font-semibold text-gray-700">Check-in</th>
										<th className="py-4 px-6 font-semibold text-gray-700">Refunded On</th>
										<th className="py-4 px-6 font-semibold text-gray-700">Total</th>
										<th className="py-4 px-6 font-semibold text-gray-700">Refund Amount</th>
										<th className="py-4 px-6 font-semibold text-gray-700">Refund Status</th>
										
									</tr>
								</thead>
								<tbody>
									{data.map(b => (
										<tr key={b._id} className="border-b border-gray-100 hover:bg-green-50 transition-colors duration-200">
											<td className="py-4 px-6 font-medium text-gray-800">{b.user?.name || b.user?.username}</td>
											<td className="py-4 px-6 text-gray-600">{b.hotel?.name || b.hotelName || '-'}</td>
											<td className="py-4 px-6 text-gray-600">{b.checkInDate ? formatDateTime(b.checkInDate) : '-'}</td>
											<td className="py-4 px-6 text-gray-600">{b.refundedAt ? formatDateTime(b.refundedAt) : '-'}</td>
											<td className="py-4 px-6 font-semibold text-green-600">${b.totalPrice}</td>
											<td className="py-4 px-6 font-semibold text-teal-600">{b.refundAmount ? ('$' + Number(b.refundAmount).toFixed(2)) : '-'}</td>
											<td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm inline-block ${
												(b.refundStatus || 'none') === 'completed' ? 'bg-linear-to-r from-green-400 to-green-500 text-white' :
												(b.refundStatus || 'none') === 'pending' ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white' :
												'bg-gray-200 text-gray-700'
											}`}>{(b.refundStatus || 'none').charAt(0).toUpperCase() + (b.refundStatus || '').slice(1)}</span></td>
											
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			
			<Pagination page={page} total={total} limit={limit} onPageChange={(p)=>loadRefunds(p)} className="mt-6" />

		</Layout>
	);
}
