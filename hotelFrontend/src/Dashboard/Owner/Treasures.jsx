import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import getImageUrl from '../../utils/getImageUrl';
import { showToast } from '../../utils/toast';
import Modal from '../../components/Modal';
import Select from '../../components/Select';

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

  const currentEditingTreasure = useMemo(() => {
    if (!editId || !selectedHotel) return null;
    return (selectedHotel.treasures || []).find(t => (t._id || t.id) === editId) || null;
  }, [editId, selectedHotel]);

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Treasures">
        <div className="bg-linear-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Treasures Management</div>
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

        <Modal title="Edit Treasure" open={showEditModal} onClose={() => { setShowEditModal(false); setEditId(null); setEditingForm({ title:'', subtitle:'', popular:false, image:null }); }} size="lg">
          <form onSubmit={(e)=>{ e.preventDefault(); saveEdit(editId); }} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: image preview + choose button */}
              <div className="w-full lg:w-1/3 flex flex-col items-center gap-3">
                <div className="w-48 h-36 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                  {(editingPreview || currentEditingTreasure?.image) ? (
                    <img src={editingPreview || getImageUrl(currentEditingTreasure.image)} alt={editingForm.title || currentEditingTreasure?.title || 'preview'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-sm text-gray-400">No image</div>
                  )}
                </div>
                <label className="px-4 py-2 border border-gray-200 rounded-md cursor-pointer bg-white hover:bg-gray-50 text-sm transition">
                  {editingForm.image ? 'Change Image' : 'Choose Image'}
                  <input name="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setEditingForm(f=>({ ...f, image: e.target.files?.[0] || null }))} />
                </label>
              </div>

              {/* Right: form fields */}
              <div className="w-full lg:w-2/3">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <label className="w-24 text-sm text-gray-600 pt-2">Title</label>
                    <input className="border border-gray-200 rounded-md w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Title" name="title" value={editingForm.title} onChange={(e)=>setEditingForm(f=>({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="flex items-start gap-4">
                    <label className="w-24 text-sm text-gray-600 pt-2">Subtitle</label>
                    <input className="border border-gray-200 rounded-md w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Subtitle" name="subtitle" value={editingForm.subtitle} onChange={(e)=>setEditingForm(f=>({ ...f, subtitle: e.target.value }))} required />
                  </div>

                  <div className="flex justify-end items-center mt-2">
                    <label className="flex items-center gap-3 text-sm text-gray-600">
                      <input name="popular" type="checkbox" checked={editingForm.popular} onChange={(e)=>setEditingForm(f=>({ ...f, popular: e.target.checked }))} className="w-4 h-4" />
                      <span>Popular</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-md hover:scale-105 transition-transform" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <button type="button" className="px-5 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition" onClick={()=>{ setShowEditModal(false); setEditId(null); setEditingForm({ title:'', subtitle:'', popular:false, image:null }); }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Modal>
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold text-gray-700">Hotel:</label>
            <div className="w-full sm:w-64 lg:w-80">
              <Select
                id="selected"
                name="selected"
                value={selected}
                onChange={(v) => setSelected(v)}
                options={[{ value: '', label: 'Select a hotel' }, ...(hotels || []).map(h => ({ value: h._id, label: h.name }))]}
                placeholder={null}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            <button className="px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-semibold hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg disabled:opacity-50" onClick={()=>setShowAddModal(true)} disabled={!selected}>Add Treasure</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="font-bold mb-4 text-xl text-yellow-600">Treasures</div>
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
                      <div key={tid} className="border rounded-2xl p-4 space-y-3 bg-white shadow-md hover:shadow-lg transition-all duration-300">
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
                          <button className="px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition flex items-center justify-center" onClick={()=>startEdit(t)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition flex items-center justify-center" onClick={()=>remove(tid)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22" />
                            </svg>
                          </button>
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
                  <table className="w-full min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 tracking-wider">
                        <th className="py-3 px-4">Image</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Subtitle</th>
                        <th className="py-3 px-4">Popular</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
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
                        <tr key={tid} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-3 px-4 align-middle">
                            {t.image ? (
                              <img src={getImageUrl(t.image)} alt={t.title} className="w-24 h-16 object-cover rounded-lg border border-gray-100 shadow-sm" />
                            ) : (
                              <div className="w-24 h-16 border rounded-lg flex items-center justify-center text-sm text-gray-400 bg-gray-50">No image</div>
                            )}
                          </td>
                          <td className="py-3 px-4 align-middle">{t.title}</td>
                          <td className="py-3 px-4 align-middle">{t.subtitle}</td>
                          <td className="py-3 px-4 align-middle">{t.popular ? 'Yes' : 'No'}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <button className="inline-flex items-center justify-center w-9 h-9 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50 transition" onClick={()=>startEdit(t)} title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button className="inline-flex items-center justify-center w-9 h-9 bg-white border border-red-100 rounded-lg shadow-sm hover:bg-red-50 transition" onClick={()=>remove(tid)} title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22" />
                                </svg>
                              </button>
                            </div>
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
          {/* Right panel removed — Add Treasure button moved next to hotel selector */}
          
        </div>
   
    </Layout>
  );
}
