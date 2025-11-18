import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { showToast } from '../../utils/toast';
import { hotelService } from '../../services/hotelService';
import getImageUrl from '../../utils/getImageUrl';
import Modal from '../../components/Modal';

export default function OwnerObjectives() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', location: '', description: '', images: null,
    dailyCapacity: 0,
    facilities: { bedrooms:1, livingrooms:1, bathrooms:1, diningrooms:1, wifi:'10 mbp/s', unitsReady:1, refrigerator:1, television:1 }
  });
  const [addPreviews, setAddPreviews] = useState([]);
  const [form, setForm] = useState({
    name: '', location: '', description: '',
    dailyCapacity: 0,
    facilities: { bedrooms:1, livingrooms:1, bathrooms:1, diningrooms:1, wifi:'10 mbp/s', unitsReady:1, refrigerator:1, television:1 }
  });
  // modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hotelService.getMyHotels();
      setHotels(res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const startEdit = (h) => {
    setEditId(h._id);
    setForm({
      name: h.name || '',
      location: h.location || '',
      description: h.description || '',
      facilities: {
        bedrooms: h.facilities?.bedrooms ?? 1,
        livingrooms: h.facilities?.livingrooms ?? 1,
        bathrooms: h.facilities?.bathrooms ?? 1,
        diningrooms: h.facilities?.diningrooms ?? 1,
        wifi: h.facilities?.wifi ?? '10 mbp/s',
        unitsReady: h.facilities?.unitsReady ?? 1,
        refrigerator: h.facilities?.refrigerator ?? 1,
        television: h.facilities?.television ?? 1,
      }
      ,
      dailyCapacity: h.dailyCapacity ?? 0
    });
    setShowEditModal(true);
  };

  const startAdd = () => {
    setShowAddModal(true);
    setAddForm({ name:'', location:'', description:'', images: null, dailyCapacity: 0, facilities: { bedrooms:1, livingrooms:1, bathrooms:1, diningrooms:1, wifi:'10 mbp/s', unitsReady:1, refrigerator:1, television:1 } });
  };

  const cancelAdd = () => { setAdding(false); };

  const saveAdd = async () => {
    // basic validation
    if (!addForm.name || !addForm.location) {
      showToast('Please enter both hotel name and location.', 'warning');
      return;
    }
    if (!addForm.address) {
      showToast('Please enter the hotel address.', 'warning');
      return;
    }
    if (!addForm.price || Number(addForm.price) <= 0) {
      showToast('Please enter a valid price per night.', 'warning');
      return;
    }

    try {
      const payload = {
        name: addForm.name,
        location: addForm.location,
        address: addForm.address,
        price: Number(addForm.price) || 0,
        description: addForm.description,
        dailyCapacity: Number(addForm.dailyCapacity) || 0,
        facilities: {
          bedrooms: Number(addForm.facilities.bedrooms) || 0,
          livingrooms: Number(addForm.facilities.livingrooms) || 0,
          bathrooms: Number(addForm.facilities.bathrooms) || 0,
          diningrooms: Number(addForm.facilities.diningrooms) || 0,
          wifi: addForm.facilities.wifi || '',
          unitsReady: Number(addForm.facilities.unitsReady) || 0,
          refrigerator: Number(addForm.facilities.refrigerator) || 0,
          television: Number(addForm.facilities.television) || 0
        }
      };
      // attach images if present
      if (addForm.images && addForm.images.length) payload.images = addForm.images;
      await hotelService.createHotel(payload);
      setShowAddModal(false);
      setAdding(false);
      await load();
    } catch (err) {
      console.error('Failed to create hotel', err);
      showToast('Failed to create hotel: ' + (err.message || 'unknown'), 'error');
    }
  };

  // build previews when images change
  useEffect(()=>{
    // revoke old urls
    addPreviews.forEach(p=>{ try{ URL.revokeObjectURL(p.url); }catch(e){} });
    if (!addForm.images || addForm.images.length === 0) { setAddPreviews([]); return; }
    const previews = (addForm.images || []).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setAddPreviews(previews);
    return ()=>{ previews.forEach(p=>{ try{ URL.revokeObjectURL(p.url); }catch(e){} }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addForm.images]);

  const saveEdit = async (id) => {
    const payload = {
      name: form.name,
      location: form.location,
      description: form.description,
      dailyCapacity: Number(form.dailyCapacity) || 0,
      facilities: {
        bedrooms: Number(form.facilities.bedrooms),
        livingrooms: Number(form.facilities.livingrooms),
        bathrooms: Number(form.facilities.bathrooms),
        diningrooms: Number(form.facilities.diningrooms),
        wifi: form.facilities.wifi,
        unitsReady: Number(form.facilities.unitsReady),
        refrigerator: Number(form.facilities.refrigerator),
        television: Number(form.facilities.television)
      }
    };
    await hotelService.updateHotel(id, payload);
    setEditId(null);
    setShowEditModal(false);
    load();
  };

  const remove = async (id) => {
    const { confirmAsync } = await import('../../utils/confirm');
    if (!await confirmAsync('Delete this hotel?')) return;
    await hotelService.deleteHotel(id);
    load();
  };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Objectives">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-bold text-2xl">Your Properties</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg w-full sm:w-auto" onClick={startAdd}>Add Hotel</button>
          </div>
        </div>
        {/* Add / Edit modals rendered at top-level of this card */}
        <Modal title="Add Hotel" open={showAddModal} onClose={()=>setShowAddModal(false)} size="lg">
          <div className="text-sm font-bold mb-4 text-gray-800">Create new hotel</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Hotel name</label>
              <input className="border-2 border-orange-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors duration-300" placeholder="e.g. Ocean View Apartments"  name="name" value={addForm.name} onChange={(e)=>setAddForm(f=>({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Location</label>
              <input className="border-2 border-orange-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors duration-300" placeholder="City, Country or address"  name="location" value={addForm.location} onChange={(e)=>setAddForm(f=>({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Address</label>
              <input id="addForm_address" name="address" className="border-2 border-orange-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors duration-300" placeholder="Street address, building or detailed address" value={addForm.address || ''} onChange={(e)=>setAddForm(f=>({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Price per night (USD)</label>
              <input id="addForm_price" name="price" className="border-2 border-orange-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors duration-300" type="number" min={0} placeholder="e.g. 120" value={addForm.price || ''} onChange={(e)=>setAddForm(f=>({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Daily capacity (0 = unlimited)</label>
              <input id="addForm_dailyCapacity" name="dailyCapacity" className="border-2 border-orange-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors duration-300" type="number" min={0} placeholder="e.g. 5" value={addForm.dailyCapacity || 0} onChange={(e)=>setAddForm(f=>({ ...f, dailyCapacity: Number(e.target.value) }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Description</label>
              <textarea className="border-2 border-orange-200 rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors duration-300" rows={3} placeholder="Short description for guests"  name="description" value={addForm.description} onChange={(e)=>setAddForm(f=>({ ...f, description: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-700 mb-2 font-semibold">Images</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="inline-block px-6 py-3 bg-white border-2 border-orange-300 rounded-xl cursor-pointer text-sm hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 w-full sm:w-auto text-center font-medium text-orange-600 shadow-md">Select images
                  <input id="addForm_images" name="images" type="file" multiple accept="image/*" onChange={(e)=>{
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setAddForm(f=>({ ...f, images: files }));
                  }} className="hidden" />
                </label>
                <div className="text-sm text-gray-600">{addForm.images ? `${addForm.images.length} file(s) selected` : 'No files selected'}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">You can upload multiple images. Larger images may take a few seconds to upload.</div>

              {addPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {addPreviews.map((p, idx) => (
                    <div key={idx} className="border rounded overflow-hidden relative bg-white">
                      <img src={p.url} alt={p.name} className="w-full h-20 object-cover" />
                      <button onClick={()=>{
                        // remove file at idx
                        setAddForm(f=>({ ...f, images: (f.images || []).filter((_,i)=>i!==idx) }));
                      }} className="absolute top-1 right-1 bg-white/90 text-red-600 px-1.5 py-0.5 rounded text-xs hover:bg-white shadow">×</button>
                      <div className="text-xs p-1 truncate bg-gray-50" title={p.name}>{p.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-2">
              <div className="text-sm font-semibold mb-3">Facilities</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bedrooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="bedrooms" value={addForm.facilities.bedrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, bedrooms: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bathrooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="bathrooms" value={addForm.facilities.bathrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, bathrooms: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Living rooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="livingrooms" value={addForm.facilities.livingrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, livingrooms: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Dining rooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="diningrooms" value={addForm.facilities.diningrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, diningrooms: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">WiFi (label)</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm"  name="wifi" value={addForm.facilities.wifi} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, wifi: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Units ready</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="unitsReady" value={addForm.facilities.unitsReady} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, unitsReady: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Refrigerator (count)</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="refrigerator" value={addForm.facilities.refrigerator} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, refrigerator: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Television (count)</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="television" value={addForm.facilities.television} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, television: Number(e.target.value) } }))} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition" onClick={saveAdd}>Create</button>
            <button className="px-4 py-2 border rounded text-sm" onClick={()=>setShowAddModal(false)}>Cancel</button>
          </div>
        </Modal>

        <Modal title="Edit Hotel" open={showEditModal} onClose={() => { setShowEditModal(false); setEditId(null); }} size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Hotel name</label>
              <input className="border rounded px-3 py-2 w-full text-sm" placeholder="e.g. Ocean View Apartments"  name="name" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Location</label>
              <input className="border rounded px-3 py-2 w-full text-sm" placeholder="City, Country or address"  name="location" value={form.location} onChange={(e)=>setForm(f=>({ ...f, location: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1 font-medium">Description</label>
              <textarea className="border rounded px-3 py-2 w-full text-sm" rows={3} placeholder="Short description for guests"  name="description" value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1 font-medium">Daily capacity (0 = unlimited)</label>
              <input id="form_dailyCapacity" name="dailyCapacity" className="border rounded px-3 py-2 w-full text-sm" type="number" min={0} placeholder="e.g. 5" value={form.dailyCapacity || 0} onChange={(e)=>setForm(f=>({ ...f, dailyCapacity: Number(e.target.value) }))} />
            </div>
            <div className="md:col-span-2 mt-2">
              <div className="text-sm font-semibold mb-3">Facilities</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bedrooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="bedrooms" value={form.facilities.bedrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, bedrooms: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bathrooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="bathrooms" value={form.facilities.bathrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, bathrooms: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Living rooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="livingrooms" value={form.facilities.livingrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, livingrooms: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Dining rooms</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="diningrooms" value={form.facilities.diningrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, diningrooms: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">WiFi</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm"  name="wifi" value={form.facilities.wifi} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, wifi: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Units ready</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="unitsReady" value={form.facilities.unitsReady} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, unitsReady: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Refrigerator</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="refrigerator" value={form.facilities.refrigerator} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, refrigerator: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Television</label>
                  <input className="border rounded px-2 py-1.5 w-full text-sm" type="number" min={0}  name="television" value={form.facilities.television} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, television: e.target.value } }))} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition" onClick={()=>saveEdit(editId)}>Save</button>
            <button className="px-4 py-2 border rounded text-sm" onClick={()=>{ setShowEditModal(false); setEditId(null); }}>Cancel</button>
          </div>
        </Modal>
        
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : hotels.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No hotels yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hotels.map(h => (
              <div key={h._id} className="border rounded-lg p-4 flex flex-col hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-sm">{h.name || 'Untitled'}</div>
                      <span className={`text-xs px-2 py-0.5 rounded ${h.status === 'approved' ? 'bg-green-100 text-green-700' : h.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.status || 'pending'}</span>
                    </div>
                    <div className="text-xs text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}</div>
                  </div>

                <div className="h-32 sm:h-36 bg-gray-100 rounded overflow-hidden mb-3">
                  {h.mainImage ? (
                    <img src={getImageUrl(h.mainImage)} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                  )}
                </div>

                <div className="text-sm text-gray-700 mb-3 line-clamp-3">{h.description ? (h.description.length > 140 ? h.description.slice(0,140)+'...' : h.description) : '-'}</div>

                {editId === h._id ? (
                  <div className="space-y-2">
                    {/* Inline edit is suppressed when using modal; modal will present the edit form */}
                    <div className="text-sm text-gray-500">Editing in popup...</div>
                    <div className="flex gap-2 pt-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition flex-1" onClick={()=>saveEdit(h._id)}>Save</button>
                      <button className="px-4 py-2 border rounded text-sm hover:bg-gray-50 transition flex-1" onClick={()=>setEditId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto">
                    <div className="text-xs text-gray-500 mb-3">
                      Bedrooms: {h.facilities?.bedrooms ?? '-'} • Baths: {h.facilities?.bathrooms ?? '-'}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 transition flex-1" onClick={()=>startEdit(h)}>Edit</button>
                      <button className="px-3 py-1.5 border rounded text-sm text-red-600 hover:bg-red-50 transition flex-1" onClick={()=>remove(h._id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      
    </Layout>
  );
}
