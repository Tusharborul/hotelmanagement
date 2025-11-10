import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { hotelService } from '../../services/hotelService';
import getImageUrl from '../../utils/getImageUrl';
import { showToast } from '../../utils/toast';

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

  // use shared helper

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
    if (!filename) {
      // Defensive: prevent calling delete with empty filename which causes 404
      showToast('Unable to delete: no image identifier available for this image.', 'warning');
      return;
    }
  const { confirmAsync } = await import('../../utils/confirm');
  if (!await confirmAsync('Delete this image?')) return;
    try {
      await hotelService.deleteImage(selected, filename);
      await load();
    } catch (err) {
      console.error('Failed to delete image', err);
      showToast('Failed to delete image: ' + (err?.response?.data?.message || err?.message), 'error');
      await load();
    }
  };

  return (
    <Layout role="owner" title="Hello, Owner" subtitle="Photos">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Hotel:</label>
          <select className="border rounded px-3 py-2 w-full sm:w-64 lg:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"  name="selected" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            <option value="">Select a hotel</option>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>

        {!selectedHotel ? (
          <div className="text-gray-500 text-center py-8">No hotel selected.</div>
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <div className="font-semibold mb-3 text-lg">Main Image</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-64 h-40 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {selectedHotel.mainImage ? (
                    <img src={getImageUrl(selectedHotel.mainImage)} alt="Main" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>
                <label className="border px-4 py-2 rounded cursor-pointer bg-blue-600 text-white text-sm hover:bg-blue-700 transition w-full sm:w-auto text-center">
                  {mainUploading ? 'Uploading...' : 'Replace main image'}
                  <input id="mainImage" name="mainImage" type="file" accept="image/*" disabled={mainUploading} onChange={onUploadMain} className="hidden" />
                </label>
              </div>
            </section>

            <section>
              <div className="font-semibold mb-3 text-lg">Gallery Images</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {(selectedHotel.images || []).map((img, idx) => {
                  const computedId = (typeof img === 'object' && img !== null) ? (img.public_id || img.url) : img;
                  const key = (typeof img === 'object' && img !== null) ? (img.public_id || img.url || idx) : (img || idx);
                  const hasId = !!computedId;
                  return (
                    <div key={key} className="relative group">
                      <img src={getImageUrl(img)} alt="Gallery" className="w-full h-32 sm:h-40 object-cover rounded" />
                      <button onClick={()=>onDeleteImage(computedId)} disabled={!hasId} title={!hasId ? 'No identifier available' : 'Delete'} className={`absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 border px-2 py-1 rounded text-xs sm:text-sm shadow ${!hasId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Delete
                      </button>
                    </div>
                  );
                })}
                {(!selectedHotel.images || selectedHotel.images.length === 0) && (
                  <div className="text-gray-400 col-span-2">No gallery images</div>
                )}
              </div>
              <label className="mt-4 inline-block border px-4 py-2 rounded cursor-pointer bg-blue-50 hover:bg-blue-100 transition text-sm">
                {galleryUploading ? 'Uploading...' : 'Add images'}
                <input id="galleryImages" name="images" type="file" accept="image/*" multiple disabled={galleryUploading} onChange={onUploadGallery} className="hidden" />
              </label>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
