import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Reader';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProfile({
      name: form.name.trim(),
      email: form.email.trim() || user?.email || ''
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', email: user?.email || '' });
    setIsEditing(false);
  };

  return (
    <section className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="user-portal-avatar grid h-14 w-14 place-items-center rounded-full bg-[#1d1b19] text-lg font-semibold text-white">
          {avatarLetter}
        </div>
        <div>
          <h3 className="text-lg font-semibold">Profile</h3>
          <p className="text-sm text-[#7a726b]">Account details and preferences</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="user-portal-field rounded-xl border border-[#efe5dc] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Email</p>
          {isEditing ? (
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="user-portal-input mt-2 w-full rounded-lg border border-[#e8dcd3] px-3 py-2 text-sm"
            />
          ) : (
            <p className="text-sm font-semibold">{user?.email || 'user@pustakly.com'}</p>
          )}
        </div>
        <div className="user-portal-field rounded-xl border border-[#efe5dc] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Name</p>
          {isEditing ? (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="user-portal-input mt-2 w-full rounded-lg border border-[#e8dcd3] px-3 py-2 text-sm"
            />
          ) : (
            <p className="text-sm font-semibold">{displayName}</p>
          )}
        </div>
        <div className="user-portal-field rounded-xl border border-[#efe5dc] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Role</p>
          <p className="text-sm font-semibold">{user?.role || 'user'}</p>
        </div>
        <div className="user-portal-field rounded-xl border border-[#efe5dc] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Member Since</p>
          <p className="text-sm font-semibold">Feb 2026</p>
        </div>
        <div className="user-portal-field rounded-xl border border-[#efe5dc] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Status</p>
          <p className="text-sm font-semibold">Active</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {isEditing ? (
          <>
            <button
              className="rounded-full bg-[#1d1b19] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={handleSave}
            >
              Save Changes
            </button>
            <button
              className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
            type="button"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
        <button className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white" type="button">
          Manage Addresses
        </button>
      </div>
    </section>
  );
}
