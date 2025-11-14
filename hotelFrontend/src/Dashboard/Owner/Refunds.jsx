
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';
import FilterControls from '../components/FilterControls';

export default function OwnerRefunds() {
	const [hotels, setHotels] = useState([]);
	const [selected, setSelected] = useState('');
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [field, setField] = useState('created');
	const [data, setData] = useState([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const limit = 20;
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
				// load selected hotel bookings
				const res = await bookingService.getHotelBookings(sel);
				const list = Array.isArray(res) ? res : (res?.data || []);
				all = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: sel, name: (hotels.find(x=>x._id===sel)?.name) || '' } }));
			} else {
				// aggregate across owner's hotels
				for (const h of (hotels || [])) {
					try {
						const res = await bookingService.getHotelBookings(h._id);
						const list = Array.isArray(res) ? res : (res?.data || []);
						const mapped = (list || []).map(b => ({ ...b, hotel: b.hotel || { _id: h._id, name: h.name } }));
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
										<th className="py-2">Hotel</th>
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
											<td className="py-2">{b.hotel?.name || b.hotelName || '-'}</td>
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
			
		</Layout>
	);
}
