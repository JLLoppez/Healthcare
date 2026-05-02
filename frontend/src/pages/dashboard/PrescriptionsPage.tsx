// pages/dashboard/PrescriptionsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Pill, Calendar, User, Search } from 'lucide-react';
import { prescriptionApi } from '@/utils/api';
import { format } from 'date-fns';
import styles from './Dashboard.module.css';

export function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionApi.getAll().then(r => r.data.data),
  });

  const filtered = (data || []).filter((rx: any) =>
    !search || rx.prescriptionId?.includes(search.toUpperCase()) ||
    rx.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.medications?.some((m: any) => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Prescriptions</h1>
          <p className={styles.subtitle}>View and manage prescriptions</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBar}>
          <Search size={15} />
          <input className={styles.searchInput} placeholder="Search by ID, medication or patient..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={styles.panel}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={40} className={styles.emptyIcon} />
            <p>No prescriptions found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((rx: any) => (
              <div key={rx._id} style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-primary)', marginBottom: 4 }}>{rx.prescriptionId}</p>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>{rx.diagnosis || 'Prescription'}</p>
                  </div>
                  <span className={`badge badge-${{ active: 'success', expired: 'warning', cancelled: 'danger', fulfilled: 'info' }[rx.status] || 'default'}`}>{rx.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={13} /> Dr. {rx.doctor?.user?.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {format(new Date(rx.issuedAt), 'MMM d, yyyy')}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {rx.medications?.map((med: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                      <Pill size={12} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{med.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{med.dosage} · {med.frequency}</span>
                    </div>
                  ))}
                </div>
                {rx.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8 }}>{rx.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrescriptionsPage;
