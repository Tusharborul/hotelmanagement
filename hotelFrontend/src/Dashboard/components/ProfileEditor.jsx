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
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      console.error('Failed to change password', err);
      showToast(err?.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md">
            {preview ? (
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">No photo</div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Change photo</label>
            <div className="flex items-center gap-3">
              <label htmlFor="profile-file" className="inline-flex items-center px-4 py-2.5 bg-white border-2 border-blue-300 rounded-xl text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-blue-600">
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300" />
        </div>

        {/* Password Change Section */}
        <div className="border-t-2 border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Change Password
          </button>

          {showPasswordSection && (
            <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="button"
                onClick={changePassword}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="px-6 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:hover:scale-100" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  );
}
