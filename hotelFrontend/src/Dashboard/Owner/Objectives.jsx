import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';

export default function OwnerObjectives() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', location: '', description: '', images: null,
    facilities: { bedrooms:1, livingrooms:1, bathrooms:1, diningrooms:1, wifi:'10 mbp/s', unitsReady:1, refrigerator:1, television:1 }
  });
  const [addPreviews, setAddPreviews] = useState([]);
  const [form, setForm] = useState({
    name: '', location: '', description: '',
    facilities: { bedrooms:1, livingrooms:1, bathrooms:1, diningrooms:1, wifi:'10 mbp/s', unitsReady:1, refrigerator:1, television:1 }
  });

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
    });
  };

  const startAdd = () => {
    setAdding(true);
    setAddForm({ name:'', location:'', description:'', images: null, facilities: { bedrooms:1, livingrooms:1, bathrooms:1, diningrooms:1, wifi:'10 mbp/s', unitsReady:1, refrigerator:1, television:1 } });
  };

  const cancelAdd = () => { setAdding(false); };

  const saveAdd = async () => {
    // basic validation
    if (!addForm.name || !addForm.location) {
      alert('Please enter both hotel name and location.');
      return;
    }
    if (!addForm.address) {
      alert('Please enter the hotel address.');
      return;
    }
    if (!addForm.price || Number(addForm.price) <= 0) {
      alert('Please enter a valid price per night.');
      return;
    }

    try {
      const payload = {
        name: addForm.name,
        location: addForm.location,
        address: addForm.address,
        price: Number(addForm.price) || 0,
        description: addForm.description,
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
      setAdding(false);
      await load();
    } catch (err) {
      console.error('Failed to create hotel', err);
      alert('Failed to create hotel: ' + (err.message || 'unknown'));
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
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this hotel?')) return;
    await hotelService.deleteHotel(id);
    load();
  };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Objectives">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Your Properties</div>
          <div className="flex items-center gap-2">
            {!adding ? (
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={startAdd}>Add Hotel</button>
            ) : (
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveAdd}>Create</button>
                <button className="px-3 py-1 border rounded" onClick={cancelAdd}>Cancel</button>
              </div>
            )}
          </div>
        </div>
        {adding && (
          <div className="mb-4 border p-4 rounded">
            <div className="text-sm font-medium mb-2">Create new hotel</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hotel name</label>
                <input className="border px-2 py-2 w-full" placeholder="e.g. Ocean View Apartments" value={addForm.name} onChange={(e)=>setAddForm(f=>({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Location</label>
                <input className="border px-2 py-2 w-full" placeholder="City, Country or address" value={addForm.location} onChange={(e)=>setAddForm(f=>({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Address</label>
                <input className="border px-2 py-2 w-full" placeholder="Street address, building or detailed address" value={addForm.address || ''} onChange={(e)=>setAddForm(f=>({ ...f, address: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea className="border px-2 py-2 w-full" rows={3} placeholder="Short description for guests" value={addForm.description} onChange={(e)=>setAddForm(f=>({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price per night (USD)</label>
                <input className="border px-2 py-2 w-full" type="number" min={0} placeholder="e.g. 120" value={addForm.price || ''} onChange={(e)=>setAddForm(f=>({ ...f, price: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Images</label>
                <div className="flex items-center gap-3">
                  <label className="inline-block px-3 py-2 bg-white border rounded cursor-pointer text-sm">Select images
                    <input type="file" multiple accept="image/*" onChange={(e)=>{
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      setAddForm(f=>({ ...f, images: files }));
                    }} className="hidden" />
                  </label>
                  <div className="text-sm text-gray-600">{addForm.images ? `${addForm.images.length} file(s) selected` : 'No files selected'}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">You can upload multiple images. Larger images may take a few seconds to upload.</div>

                {addPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {addPreviews.map((p, idx) => (
                      <div key={idx} className="border rounded overflow-hidden relative">
                        <img src={p.url} alt={p.name} className="w-full h-20 object-cover" />
                        <button onClick={()=>{
                          // remove file at idx
                          setAddForm(f=>({ ...f, images: (f.images || []).filter((_,i)=>i!==idx) }));
                        }} className="absolute top-1 right-1 bg-white/80 text-red-600 px-1 rounded text-xs">Remove</button>
                        <div className="text-xs p-1 truncate" title={p.name}>{p.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 mt-2">
                <div className="text-sm font-medium mb-2">Facilities</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bedrooms</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.bedrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, bedrooms: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bathrooms</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.bathrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, bathrooms: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Living rooms</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.livingrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, livingrooms: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Dining rooms</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.diningrooms} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, diningrooms: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">WiFi (label)</label>
                    <input className="border px-2 py-1 w-full" value={addForm.facilities.wifi} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, wifi: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Units ready</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.unitsReady} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, unitsReady: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Refrigerator (count)</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.refrigerator} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, refrigerator: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Television (count)</label>
                    <input className="border px-2 py-1 w-full" type="number" min={0} value={addForm.facilities.television} onChange={(e)=>setAddForm(f=>({ ...f, facilities: { ...f.facilities, television: Number(e.target.value) } }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : hotels.length === 0 ? (
          <div className="text-gray-500">No hotels yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotels.map(h => (
              <div key={h._id} className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{h.name || 'Untitled'}</div>
                      <span className={`text-xs px-2 py-1 rounded ${h.status === 'approved' ? 'bg-green-100 text-green-800' : h.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{h.status || 'pending'}</span>
                    </div>
                    <div className="text-xs text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}</div>
                  </div>

                <div className="h-36 bg-gray-100 rounded overflow-hidden mb-3">
                  {h.mainImage ? (
                    <img src={h.mainImage.startsWith('http') ? h.mainImage : `http://localhost:5000/uploads/${h.mainImage}`} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>

                <div className="text-sm text-gray-700 mb-3">{h.description ? (h.description.length > 140 ? h.description.slice(0,140)+'...' : h.description) : '-'}</div>

                {editId === h._id ? (
                  <div className="space-y-2">
                    <input className="border px-2 py-1 w-full" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} />
                    <input className="border px-2 py-1 w-full" value={form.location} onChange={(e)=>setForm(f=>({ ...f, location: e.target.value }))} />
                    <textarea className="border px-2 py-1 w-full" rows={3} value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} />

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs">Bedrooms
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.bedrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, bedrooms: e.target.value } }))} />
                      </label>
                      <label className="text-xs">Bathrooms
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.bathrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, bathrooms: e.target.value } }))} />
                      </label>
                      <label className="text-xs">Living rooms
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.livingrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, livingrooms: e.target.value } }))} />
                      </label>
                      <label className="text-xs">Dining rooms
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.diningrooms} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, diningrooms: e.target.value } }))} />
                      </label>
                      <label className="text-xs">WiFi
                        <input className="border px-2 py-1 w-full mt-1" value={form.facilities.wifi} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, wifi: e.target.value } }))} />
                      </label>
                      <label className="text-xs">Units ready
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.unitsReady} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, unitsReady: e.target.value } }))} />
                      </label>
                      <label className="text-xs">Refrigerator
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.refrigerator} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, refrigerator: e.target.value } }))} />
                      </label>
                      <label className="text-xs">Television
                        <input className="border px-2 py-1 w-full mt-1" type="number" min={0} value={form.facilities.television} onChange={(e)=>setForm(f=>({ ...f, facilities: { ...f.facilities, television: e.target.value } }))} />
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>saveEdit(h._id)}>Save</button>
                      <button className="px-3 py-1 border rounded" onClick={()=>setEditId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Bedrooms: {h.facilities?.bedrooms ?? '-'} • Baths: {h.facilities?.bathrooms ?? '-'}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border rounded text-sm" onClick={()=>startEdit(h)}>Edit</button>
                      <button className="px-3 py-1 border rounded text-sm" onClick={()=>remove(h._id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
