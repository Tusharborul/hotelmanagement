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
        <div className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold mb-6 text-2xl">Photos Management</div>
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Hotel:</label>
          <select className="border-2 border-purple-300 rounded-xl px-4 py-2.5 w-full sm:w-64 lg:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-gray-700 cursor-pointer hover:border-purple-400 transition-colors duration-300"  name="selected" value={selected} onChange={(e)=>setSelected(e.target.value)}>
            <option value="">Select a hotel</option>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>

        {!selectedHotel ? (
          <div className="text-gray-500 text-center py-8">No hotel selected.</div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-2xl shadow-lg p-6">
              <div className="font-bold mb-4 text-xl bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Main Image</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-64 h-40 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden flex items-center justify-center shadow-md border-2 border-purple-100">
                  {selectedHotel.mainImage ? (
                    <img src={getImageUrl(selectedHotel.mainImage)} alt="Main" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>
                <label className="border-2 border-purple-500 px-6 py-3 rounded-xl cursor-pointer bg-linear-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg w-full sm:w-auto text-center">
                  {mainUploading ? 'Uploading...' : 'Replace main image'}
                  <input id="mainImage" name="mainImage" type="file" accept="image/*" disabled={mainUploading} onChange={onUploadMain} className="hidden" />
                </label>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg p-6">
              <div className="font-bold mb-4 text-xl bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Gallery Images</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(selectedHotel.images || []).map((img, idx) => {
                  const computedId = (typeof img === 'object' && img !== null) ? (img.public_id || img.url) : img;
                  const key = (typeof img === 'object' && img !== null) ? (img.public_id || img.url || idx) : (img || idx);
                  const hasId = !!computedId;
                  return (
                    <div key={key} className="relative group">
                      <img src={getImageUrl(img)} alt="Gallery" className="w-full h-32 sm:h-40 object-cover rounded-xl shadow-md group-hover:shadow-xl transition-shadow duration-300" />
                      <button onClick={()=>onDeleteImage(computedId)} disabled={!hasId} title={!hasId ? 'No identifier available' : 'Delete'} className={`absolute top-2 right-2 bg-white/95 hover:bg-white text-red-600 border-2 border-red-400 px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-lg hover:scale-105 transition-all duration-300 font-medium ${!hasId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Delete
                      </button>
                    </div>
                  );
                })}
                {(!selectedHotel.images || selectedHotel.images.length === 0) && (
                  <div className="text-gray-400 col-span-2">No gallery images</div>
                )}
              </div>
              <label className="mt-4 inline-block border-2 border-purple-500 px-6 py-3 rounded-xl cursor-pointer bg-white hover:bg-purple-50 hover:scale-105 transition-all duration-300 text-sm font-medium text-purple-600 shadow-md hover:shadow-lg">
                {galleryUploading ? 'Uploading...' : 'Add images'}
                <input id="galleryImages" name="images" type="file" accept="image/*" multiple disabled={galleryUploading} onChange={onUploadGallery} className="hidden" />
              </label>
            </section>
          </div>
        )}
      
    </Layout>
  );
}
