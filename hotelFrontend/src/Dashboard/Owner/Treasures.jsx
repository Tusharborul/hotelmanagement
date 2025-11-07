import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';

export default function OwnerTreasures() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ title: '', subtitle: '', popular: false, image: null });
  const [editId, setEditId] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBase = useMemo(()=> apiBase.replace(/\/api\/?$/, ''), [apiBase]);

  const selectedHotel = useMemo(()=>hotels.find(h => h._id === selected), [hotels, selected]);

  const load = async () => {
    try {
      const res = await hotelService.getMyHotels();
      console.debug('Loaded hotels:', res.data);
      setHotels(res.data || []);
      if (!selected && res.data?.[0]?._id) {
        console.debug('Auto-selecting first hotel:', res.data[0]._id);
        setSelected(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load hotels:', err);
      alert('Failed to load hotels: ' + (err?.response?.data?.message || err?.message));
    }
  };

  useEffect(()=>{ load(); }, []);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      console.debug('Adding treasure', { hotelId: selected, payload: { ...form, image: !!form.image } });
      await hotelService.addTreasure(selected, form);
      setForm({ title: '', subtitle: '', popular: false, image: null });
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add treasure';
      alert(msg);
    }
  };

  const startEdit = (t) => {
    // Prefer Mongo _id, fallback to id if present
    setEditId(t._id || t.id);
    setForm({ title: t.title, subtitle: t.subtitle, popular: !!t.popular, image: null });
  };

  const saveEdit = async () => {
    if (!selected || !editId) return;
    try {
      console.debug('Updating treasure', { hotelId: selected, treasureId: editId, payload: { ...form, image: !!form.image } });
      await hotelService.updateTreasure(selected, editId, form);
      setEditId(null);
      setForm({ title: '', subtitle: '', popular: false, image: null });
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update treasure';
      alert(msg);
      // Optionally reload to ensure we have fresh IDs
      await load();
    }
  };

  const remove = async (id) => {
    if (!selected) return;
    if (!confirm('Delete this treasure?')) return;
    try {
      console.debug('Deleting treasure', { hotelId: selected, treasureId: id });
      await hotelService.deleteTreasure(selected, id);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete treasure';
      alert(msg);
      await load();
    }
  };

  const img = (f) => {
    if (!f) return '';
    if (f.startsWith('http')) return f;
    return `${serverBase}/uploads/${f}`;
  };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Treasures">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Hotel:</label>
          <select className="border rounded px-3 py-2 w-full sm:w-64 lg:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            <option value="">Select a hotel</option>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
          {selected && <span className="text-xs text-gray-500">ID: {selected.substring(0, 8)}...</span>}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="font-semibold mb-3 text-lg">{editId ? 'Edit Treasure' : 'Add Treasure'}</div>
            <form onSubmit={submitAdd} className="space-y-3">
              <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} required />
              <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Subtitle" value={form.subtitle} onChange={(e)=>setForm(f=>({ ...f, subtitle: e.target.value }))} required />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.popular} onChange={(e)=>setForm(f=>({ ...f, popular: e.target.checked }))} /> Popular
              </label>
              <label className="inline-block border px-3 py-2 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm">
                {form.image ? 'Change Image' : 'Choose Image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e)=> setForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
              </label>
              {form.image && (
                <div className="text-sm text-gray-600">Selected: {form.image.name}</div>
              )}
              {!editId ? (
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition w-full sm:w-auto" type="submit">Add Treasure</button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition flex-1 sm:flex-none" onClick={saveEdit}>Save</button>
                  <button type="button" className="px-4 py-2 border rounded text-sm hover:bg-gray-50 transition flex-1 sm:flex-none" onClick={()=>{ setEditId(null); setForm({ title:'', subtitle:'', popular:false, image:null }); }}>Cancel</button>
                </div>
              )}
            </form>
          </div>
          <div>
            <div className="font-semibold mb-3 text-lg">Treasures</div>
            {!selectedHotel ? (
              <div className="text-gray-500 text-center py-8">No hotel selected</div>
            ) : (
              <div className="space-y-3">
                {/* Mobile card view */}
                <div className="block md:hidden space-y-3">
                  {(selectedHotel.treasures || []).map(t => {
                    const tid = t._id || t.id;
                    return (
                      <div key={tid} className="border rounded-lg p-3 space-y-2">
                        <div className="flex gap-3">
                          {t.image ? (
                            <img src={img(t.image)} alt={t.title} className="w-20 h-14 object-cover rounded border flex-shrink-0" />
                          ) : (
                            <div className="w-20 h-14 border rounded flex items-center justify-center text-xs text-gray-400 flex-shrink-0">No image</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{t.title}</div>
                            <div className="text-xs text-gray-600 truncate">{t.subtitle}</div>
                            {t.popular && <span className="inline-block text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 mt-1">Popular</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button className="border px-3 py-1.5 rounded text-sm flex-1 hover:bg-gray-50 transition" onClick={()=>startEdit(t)}>Edit</button>
                          <button className="border px-3 py-1.5 rounded text-sm text-red-600 flex-1 hover:bg-red-50 transition" onClick={()=>remove(tid)}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedHotel.treasures || selectedHotel.treasures.length === 0) && (
                    <div className="text-gray-400 text-center py-8">No treasures.</div>
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b"><th className="py-2">Image</th><th className="py-2">Title</th><th className="py-2">Subtitle</th><th className="py-2">Popular</th><th className="py-2">Action</th></tr>
                    </thead>
                    <tbody>
                      {(selectedHotel.treasures || []).map(t => {
                        const tid = t._id || t.id;
                        return (
                        <tr key={tid} className="border-b">
                          <td className="py-2">
                            {t.image ? (
                              <img src={img(t.image)} alt={t.title} className="w-20 h-14 object-cover rounded border" />
                            ) : (
                              <div className="w-20 h-14 border rounded flex items-center justify-center text-xs text-gray-400">No image</div>
                            )}
                          </td>
                          <td className="py-2">{t.title}</td>
                          <td className="py-2">{t.subtitle}</td>
                          <td className="py-2">{t.popular ? 'Yes' : 'No'}</td>
                          <td className="py-2 flex gap-2">
                            <button className="border px-2 py-1 rounded text-sm hover:bg-gray-50 transition" onClick={()=>startEdit(t)}>Edit</button>
                            <button className="border px-2 py-1 rounded text-sm text-red-600 hover:bg-red-50 transition" onClick={()=>remove(tid)}>Delete</button>
                          </td>
                        </tr>
                        );
                      })}
                      {(!selectedHotel.treasures || selectedHotel.treasures.length === 0) && (
                        <tr><td className="py-3 text-gray-400" colSpan={5}>No treasures.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
