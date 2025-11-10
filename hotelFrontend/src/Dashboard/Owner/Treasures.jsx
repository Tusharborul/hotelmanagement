import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import getImageUrl from '../../utils/getImageUrl';
import { showToast } from '../../utils/toast';
import Modal from '../../components/Modal';

export default function OwnerTreasures() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ title: '', subtitle: '', popular: false, image: null });
  const [editId, setEditId] = useState(null);
  const [editingForm, setEditingForm] = useState({ title: '', subtitle: '', popular: false, image: null });
  const [saving, setSaving] = useState(false); // prevents duplicate submits
  const [addPreview, setAddPreview] = useState(null);
  const [editingPreview, setEditingPreview] = useState(null);


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
      showToast('Failed to load hotels: ' + (err?.response?.data?.message || err?.message), 'error');
    }
  };

  useEffect(()=>{ load(); }, []);

  // modal state for add/edit
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (saving) return; // prevent duplicates
    setSaving(true);
    try {
      console.debug('Adding treasure', { hotelId: selected, payload: { ...form, image: !!form.image } });
      await hotelService.addTreasure(selected, form);
      setForm({ title: '', subtitle: '', popular: false, image: null });
      // clear add preview
      if (addPreview) {
        try { URL.revokeObjectURL(addPreview); } catch(e){}
      }
      setAddPreview(null);
      await load();
      setShowAddModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add treasure';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t) => {
    // Prefer Mongo _id, fallback to id if present
    const tid = t._id || t.id;
    setEditId(tid);
    setEditingForm({ title: t.title || '', subtitle: t.subtitle || '', popular: !!t.popular, image: null });
    // clear any previous editing preview
    if (editingPreview) {
      try { URL.revokeObjectURL(editingPreview); } catch(e){}
    }
    setEditingPreview(null);
    // open edit modal instead of inline editing
    setShowEditModal(true);
  };

  const saveEdit = async (id) => {
    if (!selected || !id) return;
    if (saving) return;
    setSaving(true);
    try {
      console.debug('Updating treasure', { hotelId: selected, treasureId: id, payload: { ...editingForm, image: !!editingForm.image } });
      await hotelService.updateTreasure(selected, id, editingForm);
      setEditId(null);
      setEditingForm({ title: '', subtitle: '', popular: false, image: null });
      if (editingPreview) {
        try { URL.revokeObjectURL(editingPreview); } catch(e){}
      }
      setEditingPreview(null);
      await load();
      setShowEditModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update treasure';
      showToast(msg, 'error');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!selected) return;
    // ask user via app confirm
    const { confirmAsync } = await import('../../utils/confirm');
    const ok = await confirmAsync('Delete this treasure?');
    if (!ok) return;
    try {
      console.debug('Deleting treasure', { hotelId: selected, treasureId: id });
      await hotelService.deleteTreasure(selected, id);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete treasure';
      showToast(msg, 'error');
      await load();
    }
  };

  // use shared helper for images
  // build previews for selected files (add / edit)
  useEffect(()=>{
    // revoke previous preview when image changes
    if (addPreview) {
      try { URL.revokeObjectURL(addPreview); } catch(e){}
    }
    if (form.image) {
      try {
        const url = URL.createObjectURL(form.image);
        setAddPreview(url);
      } catch(e) { setAddPreview(null); }
    } else {
      setAddPreview(null);
    }
    // cleanup on unmount
    return ()=>{
      if (addPreview) {
        try { URL.revokeObjectURL(addPreview); } catch(e){}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.image]);

  useEffect(()=>{
    if (editingPreview) {
      try { URL.revokeObjectURL(editingPreview); } catch(e){}
    }
    if (editingForm.image) {
      try {
        const url = URL.createObjectURL(editingForm.image);
        setEditingPreview(url);
      } catch(e) { setEditingPreview(null); }
    } else {
      setEditingPreview(null);
    }
    return ()=>{
      if (editingPreview) {
        try { URL.revokeObjectURL(editingPreview); } catch(e){}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingForm.image]);

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Treasures">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        {/* Add/Edit modals rendered at top-level of this card to avoid nesting issues */}
        <Modal title="Add Treasure" open={showAddModal} onClose={()=>setShowAddModal(false)} size="md">
          <form onSubmit={submitAdd} className="space-y-3">
            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Title"  name="title" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} required />
            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Subtitle"  name="subtitle" value={form.subtitle} onChange={(e)=>setForm(f=>({ ...f, subtitle: e.target.value }))} required />
            <label className="flex items-center gap-2 text-sm">
              <input name="popular" type="checkbox" checked={form.popular} onChange={(e)=>setForm(f=>({ ...f, popular: e.target.checked }))} /> Popular
            </label>
            <label className="inline-block border px-3 py-2 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm">
              {form.image ? 'Change Image' : 'Choose Image'}
              <input name="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
            </label>
            {form.image && (
              <div>
                <div className="text-sm text-gray-600">Selected: {form.image.name}</div>
                {addPreview && (
                  <div className="mt-2">
                    <img src={addPreview} alt={form.image.name} className="w-32 h-20 object-cover rounded border" />
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition w-full sm:w-auto" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Treasure'}</button>
              <button type="button" className="px-4 py-2 border rounded text-sm" onClick={()=>setShowAddModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>

        <Modal title="Edit Treasure" open={showEditModal} onClose={() => { setShowEditModal(false); setEditId(null); setEditingForm({ title:'', subtitle:'', popular:false, image:null }); }} size="md">
          <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); saveEdit(editId); }}>
            <div className="grid md:grid-cols-3 gap-3 items-center">
              <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Title"  name="title" value={editingForm.title} onChange={(e)=>setEditingForm(f=>({ ...f, title: e.target.value }))} required />
              <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Subtitle"  name="subtitle" value={editingForm.subtitle} onChange={(e)=>setEditingForm(f=>({ ...f, subtitle: e.target.value }))} required />
              <div className="flex items-center gap-2">
                <input name="popular" type="checkbox" checked={editingForm.popular} onChange={(e)=>setEditingForm(f=>({ ...f, popular: e.target.checked }))} /> <span className="text-sm">Popular</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-block border px-3 py-2 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm">
                {editingForm.image ? 'Change Image' : 'Choose Image'}
                <input name="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setEditingForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
              </label>
              <div className="flex-1">
                {editingPreview ? (
                  <img src={editingPreview} alt={editingForm.title || 'preview'} className="w-28 h-16 object-cover rounded border" />
                ) : null}
              </div>
              <div className="flex gap-2 ml-auto">
                <button type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition" onClick={()=>saveEdit(editId)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 transition" onClick={()=>{ setShowEditModal(false); setEditId(null); setEditingForm({ title:'', subtitle:'', popular:false, image:null }); }}>Cancel</button>
              </div>
            </div>
          </form>
        </Modal>
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Hotel:</label>
          <select className="border rounded px-3 py-2 w-full sm:w-64 lg:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"  name="selected" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            <option value="">Select a hotel</option>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
          {selected && <span className="text-xs text-gray-500">ID: {selected.substring(0, 8)}...</span>}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="font-semibold mb-3 text-lg">Add Treasure</div>
            <div>
              <button className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition" onClick={()=>setShowAddModal(true)} disabled={!selected}>Add Treasure</button>
              <div className="text-xs text-gray-500 mt-2">Open the add treasure form in a popup.</div>
            </div>
            <Modal title="Add Treasure" open={showAddModal} onClose={()=>setShowAddModal(false)} size="md">
              <form onSubmit={submitAdd} className="space-y-3">
                <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Title"  name="title" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} required />
                <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Subtitle"  name="subtitle" value={form.subtitle} onChange={(e)=>setForm(f=>({ ...f, subtitle: e.target.value }))} required />
                <label className="flex items-center gap-2 text-sm">
                  <input name="popular" type="checkbox" checked={form.popular} onChange={(e)=>setForm(f=>({ ...f, popular: e.target.checked }))} /> Popular
                </label>
                <label className="inline-block border px-3 py-2 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm">
                  {form.image ? 'Change Image' : 'Choose Image'}
                  <input name="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
                </label>
                {form.image && (
                  <div>
                    <div className="text-sm text-gray-600">Selected: {form.image.name}</div>
                    {addPreview && (
                      <div className="mt-2">
                        <img src={addPreview} alt={form.image.name} className="w-32 h-20 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition w-full sm:w-auto" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Treasure'}</button>
                  <button type="button" className="px-4 py-2 border rounded text-sm" onClick={()=>setShowAddModal(false)}>Cancel</button>
                </div>
              </form>
            </Modal>
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
                    if (tid === editId && !showEditModal) {
                      return (
                        <div key={tid} className="border rounded-lg p-3 space-y-2">
                          <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); saveEdit(tid); }}>
                            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Title"  name="title" value={editingForm.title} onChange={(e)=>setEditingForm(f=>({ ...f, title: e.target.value }))} required />
                            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Subtitle"  name="subtitle" value={editingForm.subtitle} onChange={(e)=>setEditingForm(f=>({ ...f, subtitle: e.target.value }))} required />
                            <label className="flex items-center gap-2 text-sm">
                              <input name="popular" type="checkbox" checked={editingForm.popular} onChange={(e)=>setEditingForm(f=>({ ...f, popular: e.target.checked }))} /> Popular
                            </label>
                            <label className="inline-block border px-3 py-2 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm">
                              {editingForm.image ? 'Change Image' : 'Choose Image'}
                              <input name="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setEditingForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
                            </label>
                            {(editingPreview || t.image) && (
                              <div className="mt-2">
                                {editingPreview ? (
                                  <img src={editingPreview} alt={editingForm.title || 'preview'} className="w-32 h-20 object-cover rounded border" />
                                ) : t.image ? (
                                  <img src={getImageUrl(t.image)} alt={t.title} className="w-32 h-20 object-cover rounded border" />
                                ) : null}
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <button type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex-1 hover:bg-blue-700 transition" onClick={()=>saveEdit(tid)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                              <button type="button" className="px-3 py-1.5 border rounded text-sm flex-1 hover:bg-gray-50 transition" onClick={()=>{ setEditId(null); setEditingForm({ title:'', subtitle:'', popular:false, image:null }); }}>Cancel</button>
                            </div>
                          </form>
                        </div>
                      );
                    }
                    return (
                      <div key={tid} className="border rounded-lg p-3 space-y-2">
                        <div className="flex gap-3">
                          {t.image ? (
                            <img src={getImageUrl(t.image)} alt={t.title} className="w-20 h-14 object-cover rounded border shrink-0" />
                          ) : (
                            <div className="w-20 h-14 border rounded flex items-center justify-center text-xs text-gray-400 shrink-0">No image</div>
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
                        if (tid === editId && !showEditModal) {
                          return (
                            <tr key={tid} className="border-b">
                              <td className="py-2" colSpan={5}>
                                <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); saveEdit(tid); }}>
                                  <div className="grid md:grid-cols-3 gap-3 items-center">
                                    <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Title"  name="title" value={editingForm.title} onChange={(e)=>setEditingForm(f=>({ ...f, title: e.target.value }))} required />
                                    <input className="border rounded w-full px-3 py-2 text-sm" placeholder="Subtitle"  name="subtitle" value={editingForm.subtitle} onChange={(e)=>setEditingForm(f=>({ ...f, subtitle: e.target.value }))} required />
                                    <div className="flex items-center gap-2">
                                      <input name="popular" type="checkbox" checked={editingForm.popular} onChange={(e)=>setEditingForm(f=>({ ...f, popular: e.target.checked }))} /> <span className="text-sm">Popular</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label className="inline-block border px-3 py-2 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm">
                                      {editingForm.image ? 'Change Image' : 'Choose Image'}
                                      <input name="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setEditingForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
                                    </label>
                                      <div className="flex-1">
                                        {(editingPreview) ? (
                                          <img src={editingPreview} alt={editingForm.title || 'preview'} className="w-28 h-16 object-cover rounded border" />
                                        ) : null}
                                      </div>
                                      <div className="flex gap-2 ml-auto">
                                      <button type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition" onClick={()=>saveEdit(tid)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                                      <button type="button" className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 transition" onClick={()=>{ setEditId(null); setEditingForm({ title:'', subtitle:'', popular:false, image:null }); }}>Cancel</button>
                                    </div>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        }
                        return (
                        <tr key={tid} className="border-b">
                          <td className="py-2">
                            {t.image ? (
                              <img src={getImageUrl(t.image)} alt={t.title} className="w-20 h-14 object-cover rounded border" />
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
