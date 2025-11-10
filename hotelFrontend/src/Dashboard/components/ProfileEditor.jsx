import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { authService } from '../../services/authService';
import { showToast } from '../../utils/toast';

export default function ProfileEditor({ open, onClose }) {
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [filename, setFilename] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);
    setName(u?.name || '');
    // avatar stored as object { url, public_id } on the backend
    setPreview(u?.avatar?.url || u?.photo || '');
    setFilename('');
  }, [open]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFile(f);
      setFilename(f.name);
    }
  };



  const save = async () => {
    setSaving(true);
    try {
      // try a common API shape; fall back gracefully if not implemented
      if (typeof authService.updateProfile === 'function') {
        await authService.updateProfile({ name, photo: file });
      } else if (typeof authService.updateUser === 'function') {
        await authService.updateUser({ name, photo: file });
      } else if (typeof authService.update === 'function') {
        await authService.update({ name, photo: file });
      } else {
        // last resort: update local storage/current user copy if available
        const u = authService.getCurrentUser() || {};
        u.name = name;
        if (preview) u.avatar = { url: preview };
        if (authService.setCurrentUser) authService.setCurrentUser(u);
      }

      showToast('Profile updated', 'success');
      onClose && onClose();
    } catch (err) {
      console.error('Failed to update profile', err);
      showToast(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">No photo</div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Change photo</label>
            <div className="flex items-center gap-3">
              <label htmlFor="profile-file" className="inline-flex items-center px-3 py-2 bg-white border rounded text-sm cursor-pointer hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0-8l-3 3m3-3l3 3M7 8l5-5 5 5" />
                </svg>
                <span className="ml-2">Choose file</span>
              </label>
              <div className="text-sm text-gray-500">{filename || 'No file chosen'}</div>
              <input id="profile-file" type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  );
}
