// pages/dashboard/AppointmentDetailPage.tsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Video, MapPin, Calendar, Clock, FileText, ChevronLeft, CreditCard } from 'lucide-react';
import { appointmentApi } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentApi.getOne(id!).then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => appointmentApi.updateStatus(id!, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointment', id] }); toast.success('Status updated'); },
    onError: () => toast.error('Update failed'),
  });

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Appointment not found</div>;

  const apt = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={15} /> Back
        </button>
        <div>
          <h1 className={styles.title} style={{ fontSize: 20 }}>Appointment Details</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-primary)', marginTop: 2 }}>{apt.appointmentId}</p>
        </div>
        <span className={`badge badge-${{ pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger' }[apt.status] || 'default'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          {apt.status}
        </span>
      </div>

      <div className={styles.grid2}>
        <div className={styles.panel}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
            {user?.role === 'patient' ? 'Doctor Information' : 'Patient Information'}
          </h3>
          {user?.role === 'patient' ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <img src={apt.doctor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctor?.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0`}
                alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{apt.doctor?.user?.name}</p>
                <p style={{ color: 'var(--accent-secondary)', fontSize: 13 }}>{apt.doctor?.specialization}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{apt.doctor?.user?.email}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <img src={apt.patient?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient?.name || 'P')}&background=1a1a2e&color=00f5a0`}
                alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{apt.patient?.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{apt.patient?.email}</p>
                {apt.patient?.bloodType && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Blood type: {apt.patient?.bloodType}</p>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: Calendar, label: 'Date', val: format(new Date(apt.scheduledAt), 'EEEE, MMMM d, yyyy') },
              { icon: Clock, label: 'Time', val: format(new Date(apt.scheduledAt), 'h:mm a') },
              { icon: apt.type === 'video' ? Video : MapPin, label: 'Type', val: apt.type === 'video' ? 'Video Consultation' : 'In-Person' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                <Icon size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 60 }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.panel}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Visit Details</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Reason</p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>{apt.reason}</p>
            {apt.symptoms?.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Symptoms</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {apt.symptoms.map((s: string) => <span key={s} className="badge badge-default">{s}</span>)}
                </div>
              </>
            )}
            {apt.diagnosis && (
              <>
                <div className="divider" />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Diagnosis</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{apt.diagnosis}</p>
              </>
            )}
            {apt.notes?.doctor && (user?.role === 'patient' || user?.role === 'doctor') && (
              <>
                <div className="divider" />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Doctor's Notes</p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{apt.notes.doctor}</p>
              </>
            )}
          </div>

          <div className={styles.panel}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Payment</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}>${apt.payment?.amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status</span>
              <span className={`badge badge-${{ paid: 'success', pending: 'warning', refunded: 'info', failed: 'danger' }[apt.payment?.status] || 'default'}`}>
                {apt.payment?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {apt.type === 'video' && ['confirmed', 'pending'].includes(apt.status) && (
          <Link to={`/video/${apt._id}`} className="btn btn-primary">
            <Video size={16} /> Join Video Call
          </Link>
        )}
        {user?.role === 'doctor' && apt.status === 'confirmed' && (
          <button className="btn btn-secondary" onClick={() => statusMutation.mutate('completed')}>
            Mark Completed
          </button>
        )}
        {user?.role === 'doctor' && apt.status === 'pending' && (
          <button className="btn btn-secondary" onClick={() => statusMutation.mutate('confirmed')}>
            Confirm Appointment
          </button>
        )}
        {['pending', 'confirmed'].includes(apt.status) && (
          <button className="btn btn-danger" onClick={() => {
            const reason = prompt('Cancellation reason:') ?? '';
            appointmentApi.updateStatus(apt._id, { status: 'cancelled', cancellationReason: reason })
              .then(() => { qc.invalidateQueries({ queryKey: ['appointment', id] }); toast.success('Cancelled'); })
              .catch(() => toast.error('Failed'));
          }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
