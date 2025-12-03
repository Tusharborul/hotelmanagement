import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../../components/Spinner';
import { hotelService } from '../../services/hotelService';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import { showToast } from '../../utils/toast';

const Rooms = () => {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acCount, setAcCount] = useState('');
  const [nonAcCount, setNonAcCount] = useState('');
  const [newRooms, setNewRooms] = useState([{ number: '', type: 'AC' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState({}); // { [roomId]: tempNumber }
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState({ title: '', body: null, confirmLabel: 'Confirm', onConfirm: null });

  const selectedHotel = useMemo(() => hotels.find(h => h._id === selected), [hotels, selected]);

  const loadHotels = async () => {
    try {
      const res = await hotelService.getMyHotels();
      setHotels(res.data || []);
      if (!selected && res.data?.[0]?._id) setSelected(res.data[0]._id);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load hotels');
    }
  };

  const loadRooms = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await hotelService.listRooms(selected);
      const list = res?.data || res || [];
      setRooms(list);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHotels(); }, []);
  useEffect(() => { loadRooms(); }, [selected]);

  const stats = useMemo(() => {
    const ac = rooms.filter(r => r.type === 'AC');
    const nac = rooms.filter(r => r.type === 'Non-AC');
    const countActive = (arr) => arr.filter(r => r.active).length;
    return {
      total: rooms.length,
      acTotal: ac.length,
      acActive: countActive(ac),
      nonAcTotal: nac.length,
      nonAcActive: countActive(nac)
    };
  }, [rooms]);

  const visibleRooms = useMemo(() => {
    return rooms
      .filter(r => (filterType === 'ALL' ? true : r.type === filterType))
      .filter(r => (filterStatus === 'ALL' ? true : (filterStatus === 'ACTIVE' ? r.active : !r.active)))
      .filter(r => (search ? (String(r.number).toLowerCase().includes(search.toLowerCase())) : true));
  }, [rooms, filterType, filterStatus, search]);

  const addRow = () => setNewRooms(prev => [...prev, { number: '', type: 'AC' }]);
  const updateRow = (idx, key, val) => setNewRooms(prev => prev.map((r,i) => i===idx ? { ...r, [key]: val } : r));
  const removeRow = (idx) => setNewRooms(prev => prev.filter((_,i) => i!==idx));

  const submitAdd = async () => {
    setError('');
    if (!selected) { setError('Missing hotel'); return; }
    setSaving(true);
    try {
      if (acCount || nonAcCount) {
        await hotelService.addRooms(selected, { acCount: Number(acCount)||0, nonAcCount: Number(nonAcCount)||0 });
      }
      const payloadRooms = newRooms.filter(r => r.number && r.type);
      if (payloadRooms.length) {
        await hotelService.addRooms(selected, { rooms: payloadRooms });
      }
      setAcCount(''); setNonAcCount(''); setNewRooms([{ number: '', type: 'AC' }]);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add rooms');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (room) => {
    if (!selected) return;
    try {
      await hotelService.updateRoom(selected, room._id, { active: !room.active });
      await loadRooms();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to update room', 'error');
    }
  };

  const openConfirm = ({ title, body, confirmLabel = 'Confirm', onConfirm }) => {
    setModalState({ title, body, confirmLabel, onConfirm });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalState({ title: '', body: null, confirmLabel: 'Confirm', onConfirm: null });
  };

  return (
    <Layout role="owner" title="Manage Rooms" subtitle={selectedHotel ? selectedHotel.name : ''}>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Filters, Stats, Room Cards */}
            <div className="lg:col-span-2 space-y-8">

              {/* Filters */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Hotel</label>
                    <div className="mt-1">
                      <Select
                        id="selected"
                        name="selected"
                        value={selected}
                        onChange={v => setSelected(v)}
                        options={[{ value: '', label: 'Select a hotel' }, ...(hotels || []).map(h => ({ value: h._id, label: h.name }))]}
                        placeholder={null}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500">AC</label>
                    <div className="mt-1">
                      <Select id="filterType" name="filterType" value={filterType} onChange={v => setFilterType(v)} options={[{ value: 'ALL', label: 'All types' }, { value: 'AC', label: 'AC' }, { value: 'Non-AC', label: 'Non-AC' }]} placeholder={null} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500">Status</label>
                    <div className="mt-1">
                      <Select id="filterStatus" name="filterStatus" value={filterStatus} onChange={v => setFilterStatus(v)} options={[{ value: 'ALL', label: 'All status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} placeholder={null} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500">Search</label>
                    <div className="relative mt-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                      <input className="w-full rounded-lg border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 pl-10 text-sm py-2 px-3" placeholder="Search room no." type="text" value={search} onChange={e=>setSearch(e.target.value)} />
                    </div>
                  </div>

                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow">
                  <p className="text-sm text-slate-500">AC (active/total)</p>
                  <p className="text-2xl font-bold text-blue-500 mt-1">{stats.acActive} / {stats.acTotal}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                  <p className="text-sm text-slate-500">Non-AC (active/total)</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.nonAcActive} / {stats.nonAcTotal}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                  <p className="text-sm text-slate-500">Active rooms</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">{stats.acActive + stats.nonAcActive}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                  <p className="text-sm text-slate-500">Total rooms</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                </div>
              </div>

              {/* Room Cards */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Existing Rooms</h2>

                {loading ? (
                  <div className="flex justify-center py-8"><Spinner label="Loading rooms..." /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleRooms.map(r => (
                      <div key={r._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg text-slate-800">{r.number}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type==='AC' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-700'}`}>{r.type}</span>
                          </div>
                          <p className="font-semibold text-green-600 text-sm">{r.active ? 'Active' : 'Inactive'}</p>
                        </div>

                        <div className="flex items-center mt-4 space-x-3">
                          <button className="text-sm font-medium text-blue-500 hover:underline" onClick={() => setEditing(ed => ({ ...ed, [r._id]: r.number }))}>Edit</button>

                          <div
                            className={`w-10 h-5 rounded-full p-0.5 flex items-center cursor-pointer ${r.active ? 'bg-green-500' : 'bg-gray-200'}`}
                            onClick={() => toggleActive(r)}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${r.active ? 'translate-x-5' : ''}`} />
                          </div>

                          <button className="text-sm font-medium text-red-500 hover:underline" onClick={() => {
                            const verb = 'Remove';
                            openConfirm({
                              title: `${verb} room ${r.number}?`,
                              body: (<div className="text-sm text-slate-700">Do you want to remove this room?</div>),
                              confirmLabel: verb,
                              onConfirm: async () => {
                                try {
                                  const res = await hotelService.deleteRoom(selected, r._id);
                                  const action = res?.action;
                                  if (action === 'deleted') showToast('Room deleted successfully.', 'success');
                                  else showToast('Room has bookings, so it was removed (deactivated).', 'info');
                                  await loadRooms();
                                } catch (e) {
                                  showToast(e?.response?.data?.message || 'Failed to update room', 'error');
                                }
                              }
                            });
                          }}>Remove</button>
                        </div>

                        {editing[r._id] !== undefined && (
                          <div className="w-full sm:w-auto flex items-center gap-2 mt-3">
                            <input className="border rounded px-3 py-2 text-sm w-full sm:w-40" value={editing[r._id]} onChange={(e)=>setEditing(ed => ({ ...ed, [r._id]: e.target.value }))} />
                            <button className="text-green-700 text-sm font-semibold" onClick={async ()=>{
                              try {
                                const val = String(editing[r._id]||'').trim();
                                if (!val) { showToast('Room number cannot be empty', 'warning'); return; }
                                await hotelService.updateRoom(selected, r._id, { number: val });
                                setEditing(ed => { const copy = { ...ed }; delete copy[r._id]; return copy; });
                                await loadRooms();
                                showToast('Room updated', 'success');
                              } catch (e) {
                                showToast(e?.response?.data?.message || 'Failed to update room number', 'error');
                              }
                            }}>Save</button>
                            <button className="text-gray-600 text-sm" onClick={()=>setEditing(ed => { const copy = { ...ed }; delete copy[r._id]; return copy; })}>Cancel</button>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

            {/* Right: Add New Rooms Side Panel */}
            <div className="lg:col-span-1">
              <div className="bg-blue-50 rounded-xl p-6 lg:sticky lg:top-24">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="material-symbols-outlined">add_circle</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Add New Rooms</h2>
                    <p className="text-sm text-slate-500">Quickly expand your room inventory.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Add by Count (AC)</label>
                    <input className="w-full rounded-lg border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3" id="ac-count" placeholder="e.g., 5" type="number" value={acCount} onChange={e=>setAcCount(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Add by Count (Non-AC)</label>
                    <input className="w-full rounded-lg border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3" id="Non-AC-count" placeholder="e.g., 3" type="number" value={nonAcCount} onChange={e=>setNonAcCount(e.target.value)} />
                  </div>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-blue-50 px-2 text-sm text-slate-500">Or add by room number</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {newRooms.map((nr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input className="flex-grow rounded-lg border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3" placeholder="Room no. (e.g., B101)" type="text" value={nr.number} onChange={e=>updateRow(idx,'number',e.target.value)} />
                      <select className="rounded-lg border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3" value={nr.type} onChange={e=>updateRow(idx,'type',e.target.value)}>
                        <option value="AC">AC</option>
                        <option value="Non-AC">Non-AC</option>
                      </select>
                      <button className="p-2 text-slate-500 hover:text-red-500" onClick={()=>removeRow(idx)}>
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <button type="button" onClick={addRow} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base mr-1">add</span>
                    Add another
                  </button>

                  <button disabled={saving} onClick={submitAdd} className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base mr-1">save</span>
                    {saving? 'Saving...' : 'Save Rooms'}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
      <Modal open={modalOpen} onClose={closeModal} title={modalState.title}>
        <div>{modalState.body}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 rounded border" onClick={closeModal}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={async () => { if (modalState.onConfirm) { await modalState.onConfirm(); } closeModal(); }}>{modalState.confirmLabel}</button>
        </div>
      </Modal>
    </Layout>
  );
};

export default Rooms;
