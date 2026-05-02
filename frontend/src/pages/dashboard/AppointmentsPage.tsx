import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Video, MapPin, Clock, ChevronRight, X } from 'lucide-react';
import { appointmentApi } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'warning', confirmed: 'info', 'in-progress': 'success',
  completed: 'success', cancelled: 'danger', 'no-show': 'danger', rescheduled: 'default'
};

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params: any = { page, limit: 15 };
  if (statusFilter !== 'all') params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentApi.getAll(params).then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentApi.updateStatus(id, { status: 'cancelled', cancellationReason: reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled');
    },
    onError: () => toast.error('Could not cancel appointment'),
  });

  const handleCancel = (id: string) => {
    const reason = prompt('Reason for cancellation (optional):') ?? '';
    cancelMutation.mutate({ id, reason });
  };

  const filtered = (data?.data || []).filter((apt: any) => {
    if (!search) return true;
    const name = apt.doctor?.user?.name || apt.patient?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Manage all your appointments</p>
        </div>
        {user?.role === 'patient' && (
          <Link to="/doctors" className="btn btn-primary">
            <Calendar size={16} /> Book New
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchBar}>
          <Search size={15} />
          <input
            className={styles.searchInput}
            placeholder="Search by doctor or patient name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>{user?.role === 'patient' ? 'Doctor' : 'Patient'}</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>No appointments found</p>
                  </td>
                </tr>
              )}
              {filtered.map((apt: any) => (
                <motion.tr
                  key={apt._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-primary)' }}>
                      {apt.appointmentId}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={
                          user?.role === 'patient'
                            ? apt.doctor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctor?.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0`
                            : apt.patient?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient?.name || 'P')}&background=1a1a2e&color=00f5a0`
                        }
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {user?.role === 'patient' ? apt.doctor?.user?.name : apt.patient?.name}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {user?.role === 'patient' ? apt.doctor?.specialization : apt.patient?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{format(new Date(apt.scheduledAt), 'MMM d, yyyy')}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(apt.scheduledAt), 'h:mm a')}</p>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {apt.type === 'video' ? <Video size={13} /> : <MapPin size={13} />}
                      {apt.type === 'video' ? 'Video' : 'In-Person'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${STATUS_COLORS[apt.status] || 'default'}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: apt.payment?.status === 'paid' ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                      ${apt.payment?.amount || 0}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/dashboard/appointments/${apt._id}`} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
                        <ChevronRight size={14} />
                      </Link>
                      {apt.type === 'video' && ['confirmed', 'in-progress'].includes(apt.status) && (
                        <Link to={`/video/${apt._id}`} className="btn btn-primary btn-sm">
                          Join
                        </Link>
                      )}
                      {['pending', 'confirmed'].includes(apt.status) && user?.role === 'patient' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(apt._id)}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '20px 0 4px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {page} of {data.pages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === data.pages}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
