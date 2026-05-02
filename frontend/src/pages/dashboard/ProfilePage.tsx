// pages/dashboard/ProfilePage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Camera, Save } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, formState: { isDirty } } = useForm({ defaultValues: {
    name: user?.name || '', phone: user?.phone || '',
    gender: (user as any)?.gender || '', bloodType: (user as any)?.bloodType || '',
  }});

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/users/profile', data),
    onSuccess: ({ data }) => { updateUser(data.data); toast.success('Profile updated'); },
    onError: () => toast.error('Update failed'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.post('/uploads/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar: data.data.avatar });
      toast.success('Avatar updated');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile Settings</h1>
      </div>
      <div className={styles.grid2}>
        <div className={styles.panel}>
          <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Personal Information</h2>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1a1a2e&color=00f5a0&size=200`}
                alt={user?.name}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-accent)' }}
              />
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-inverse)' }}>
                <Camera size={13} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{user?.name}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</p>
              <span className={`badge badge-${{ admin: 'danger', doctor: 'info', patient: 'success' }[user?.role || 'patient']}`} style={{ marginTop: 4 }}>{user?.role}</span>
            </div>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input {...register('name')} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input {...register('phone')} className="form-input" type="tel" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select {...register('gender')} className="form-input">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Type</label>
                <select {...register('bloodType')} className="form-input">
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending || !isDirty} style={{ alignSelf: 'flex-start' }}>
              <Save size={15} /> {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.panel}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Account Security</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Keep your account secure with a strong password.</p>
            <button className="btn btn-secondary btn-sm">Change Password</button>
          </div>
          <div className={styles.panel}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Email Verification</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`badge badge-${user?.isEmailVerified ? 'success' : 'warning'}`}>
                {user?.isEmailVerified ? '✓ Verified' : 'Not Verified'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
