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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex items-center gap-3">
          <label className="mr-2">Hotel:</label>
          <select className="border px-2 py-1" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name} — {h.location}</option>)}
          </select>
          {selected && <span className="text-xs text-gray-500">ID: {selected.substring(0, 8)}...</span>}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="font-semibold mb-2">{editId ? 'Edit Treasure' : 'Add Treasure'}</div>
            <form onSubmit={submitAdd} className="space-y-3">
              <input className="border rounded w-full px-3 py-2" placeholder="Title" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} required />
              <input className="border rounded w-full px-3 py-2" placeholder="Subtitle" value={form.subtitle} onChange={(e)=>setForm(f=>({ ...f, subtitle: e.target.value }))} required />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.popular} onChange={(e)=>setForm(f=>({ ...f, popular: e.target.checked }))} /> Popular
              </label>
              <label className="inline-block border px-3 py-1 rounded cursor-pointer">
                {form.image ? 'Change Image' : 'Choose Image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e)=> setForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
              </label>
              {form.image && (
                <div className="text-sm text-gray-600">Selected: {form.image.name}</div>
              )}
              {!editId ? (
                <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Add</button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveEdit}>Save</button>
                  <button type="button" className="px-4 py-2 border rounded" onClick={()=>{ setEditId(null); setForm({ title:'', subtitle:'', popular:false, image:null }); }}>Cancel</button>
                </div>
              )}
            </form>
          </div>
          <div>
            <div className="font-semibold mb-2">Treasures</div>
            {!selectedHotel ? 'No hotel selected' : (
              <table className="w-full text-left">
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
                        <button className="border px-2 py-1 rounded" onClick={()=>startEdit(t)}>Edit</button>
                        <button className="border px-2 py-1 rounded" onClick={()=>remove(tid)}>Delete</button>
                      </td>
                    </tr>
                    );
                  })}
                  {(!selectedHotel.treasures || selectedHotel.treasures.length === 0) && (
                    <tr><td className="py-3 text-gray-400" colSpan={5}>No treasures.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
