// pages/dashboard/AdminUsersPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { adminApi } from '@/utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, search],
    queryFn: () => adminApi.getUsers({ role: roleFilter === 'all' ? undefined : roleFilter, search: search || undefined }).then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserActive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status updated'); },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>{data?.total || 0} total users</p>
        </div>
      </div>
      <div className={styles.filterBar}>
        <div className={styles.searchBar}>
          <Search size={15} />
          <input className={styles.searchInput} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'patient', 'doctor', 'admin'].map(r => (
          <button key={r} className={`${styles.chip} ${roleFilter === r ? styles.chipActive : ''}`} onClick={() => setRoleFilter(r)}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
              ))}
              {data?.data?.map((u: any) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=1a1a2e&color=00f5a0`} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${{ admin: 'danger', doctor: 'info', patient: 'success' }[u.role]}`}>{u.role}</span></td>
                  <td style={{ fontSize: 13 }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td style={{ fontSize: 13 }}>{u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy') : 'Never'}</td>
                  <td><span className={`badge badge-${u.isActive ? 'success' : 'danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => toggleMutation.mutate(u._id)}
                      disabled={u.role === 'admin'}
                      style={{ opacity: u.role === 'admin' ? 0.4 : 1 }}
                    >
                      {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUsersPage;
