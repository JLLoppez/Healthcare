import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, XCircle, Star } from 'lucide-react';
import { adminApi, doctorApi } from '@/utils/api';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

export function AdminDoctorsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const qc = useQueryClient();

  const params: any = { limit: 50 };
  if (filter === 'pending') params.isVerified = false;
  if (filter === 'verified') params.isVerified = true;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-doctors', filter, search],
    queryFn: () => doctorApi.getAll({ ...params, search: search || undefined, isVerified: filter === 'all' ? undefined : filter === 'verified' ? 'true' : 'false' }).then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) => adminApi.verifyDoctor(id, isVerified),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success(`Doctor ${vars.isVerified ? 'verified' : 'unverified'} successfully`);
    },
    onError: () => toast.error('Action failed'),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Doctor Management</h1>
          <p className={styles.subtitle}>Review and verify doctor applications</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBar}>
          <Search size={15} />
          <input className={styles.searchInput} placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['all', 'pending', 'verified'] as const).map(f => (
          <button key={f} className={`${styles.chip} ${filter === f ? styles.chipActive : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && data?.total > 0 && filter !== 'pending' && (
              <span style={{ marginLeft: 4, background: '#f59e0b', color: '#050508', padding: '1px 6px', borderRadius: 99, fontSize: 10, fontWeight: 800 }}>
                {data.total}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
          </div>
        ) : !data?.data?.length ? (
          <div className={styles.empty}>
            <CheckCircle size={36} className={styles.emptyIcon} />
            <p>No {filter === 'pending' ? 'pending' : ''} doctors found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.data.map((doc: any) => (
              <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, background: 'var(--bg-elevated)', borderRadius: 14, border: `1px solid ${doc.isVerified ? 'var(--border-default)' : 'rgba(245,158,11,0.2)'}` }}>
                <img
                  src={doc.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0&size=200`}
                  alt=""
                  style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>{doc.user?.name}</p>
                    <span className={`badge badge-${doc.isVerified ? 'success' : 'warning'}`}>
                      {doc.isVerified ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--accent-secondary)', marginBottom: 6 }}>{doc.specialization} · {doc.experience}yr exp</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>License: {doc.licenseNumber}</span>
                    <span>Fee: ${doc.consultationFee}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={11} style={{ color: '#f59e0b' }} /> {doc.averageRating?.toFixed(1) || '0.0'} ({doc.totalReviews || 0})
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!doc.isVerified ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => verifyMutation.mutate({ id: doc._id, isVerified: true })}
                      disabled={verifyMutation.isPending}
                    >
                      <CheckCircle size={13} /> Verify
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => verifyMutation.mutate({ id: doc._id, isVerified: false })}
                      disabled={verifyMutation.isPending}
                    >
                      <XCircle size={13} /> Unverify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDoctorsPage;
