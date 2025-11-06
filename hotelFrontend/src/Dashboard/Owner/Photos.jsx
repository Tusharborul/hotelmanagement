import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';

export default function OwnerPhotos() {
  const [hotels, setHotels] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [mainUploading, setMainUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const selectedHotel = useMemo(() => hotels.find(h => h._id === selected), [hotels, selected]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hotelService.getMyHotels();
      setHotels(res.data || []);
      if (!selected && res.data?.[0]?._id) setSelected(res.data[0]._id);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const imageUrl = (filename) => filename?.startsWith('http') ? filename : (filename ? `http://localhost:5000/uploads/${filename}` : '');

  const onUploadMain = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setMainUploading(true);
    try {
      await hotelService.updateMainImage(selected, file);
      await load();
    } finally { setMainUploading(false); }
  };

  const onUploadGallery = async (e) => {
    const files = e.target.files;
    if (!files || !selected) return;
    setGalleryUploading(true);
    try {
      await hotelService.addImages(selected, files);
      await load();
    } finally { setGalleryUploading(false); }
  };

  const onDeleteImage = async (filename) => {
    if (!selected) return;
    if (!confirm('Delete this image?')) return;
    await hotelService.deleteImage(selected, filename);
    await load();
  };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Photos">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex items-center gap-3">
          <label className="mr-2">Hotel:</label>
          <select className="border px-2 py-1" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name} — {h.location}</option>)}
          </select>
        </div>

        {!selectedHotel ? (
          <div>No hotel selected.</div>
        ) : (
          <div className="flex flex-col gap-8">
            <section>
              <div className="font-semibold mb-2">Main Image</div>
              <div className="flex items-center gap-4">
                <div className="w-64 h-40 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {selectedHotel.mainImage ? (
                    <img src={imageUrl(selectedHotel.mainImage)} alt="Main" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>
                <label className="border px-3 py-2 rounded cursor-pointer bg-blue-600 text-white">
                  {mainUploading ? 'Uploading...' : 'Replace main image'}
                  <input type="file" accept="image/*" disabled={mainUploading} onChange={onUploadMain} className="hidden" />
                </label>
              </div>
            </section>

            <section>
              <div className="font-semibold mb-2">Gallery Images</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(selectedHotel.images || []).map((img) => (
                  <div key={img} className="relative group">
                    <img src={imageUrl(img)} alt="Gallery" className="w-full h-40 object-cover rounded" />
                    <button onClick={()=>onDeleteImage(img)} className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 border px-2 py-0.5 rounded">Delete</button>
                  </div>
                ))}
                {(!selectedHotel.images || selectedHotel.images.length === 0) && (
                  <div className="text-gray-400">No gallery images</div>
                )}
              </div>
              <label className="mt-3 inline-block border px-3 py-2 rounded cursor-pointer bg-blue-50">
                {galleryUploading ? 'Uploading...' : 'Add images'}
                <input type="file" accept="image/*" multiple disabled={galleryUploading} onChange={onUploadGallery} className="hidden" />
              </label>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
