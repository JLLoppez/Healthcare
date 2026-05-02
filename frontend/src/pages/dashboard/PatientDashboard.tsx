// pages/dashboard/PatientDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText, CreditCard, Video, ArrowRight, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { appointmentApi, paymentApi } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import styles from './Dashboard.module.css';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'warning', icon: Clock, label: 'Pending' },
  confirmed: { color: 'info', icon: CheckCircle, label: 'Confirmed' },
  completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'danger', icon: AlertCircle, label: 'Cancelled' },
  'in-progress': { color: 'success', icon: Video, label: 'In Progress' },
};

export default function PatientDashboard() {
  const { user } = useAuthStore();

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: () => appointmentApi.getUpcoming().then(r => r.data.data),
  });

  const { data: allAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentApi.getAll({ limit: 50 }).then(r => r.data.data),
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getHistory().then(r => r.data.data),
  });

  const stats = [
    {
      icon: Calendar,
      label: 'Upcoming',
      value: upcoming?.length || 0,
      color: '#00d4ff',
      link: '/dashboard/appointments'
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: allAppointments?.filter((a: any) => a.status === 'completed').length || 0,
      color: '#00f5a0',
      link: '/dashboard/appointments'
    },
    {
      icon: FileText,
      label: 'Prescriptions',
      value: '-',
      color: '#8b5cf6',
      link: '/dashboard/prescriptions'
    },
    {
      icon: CreditCard,
      label: 'Total Spent',
      value: `$${payments?.reduce((s: number, p: any) => s + (p.payment?.amount || 0), 0).toFixed(0) || 0}`,
      color: '#f59e0b',
      link: '/dashboard/payments'
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Here's your health overview</p>
        </div>
        <Link to="/doctors" className="btn btn-primary">
          <Search size={16} /> Find a Doctor
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={s.link} style={{ textDecoration: 'none', display: 'contents' }}>
              <div className={styles.statIcon} style={{ background: `${s.color}18`, color: s.color }}>
                <s.icon size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className={styles.grid2}>
        {/* Upcoming Appointments */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Upcoming Appointments</h2>
            <Link to="/dashboard/appointments" className={styles.panelLink}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {!upcoming || upcoming.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={32} className={styles.emptyIcon} />
              <p>No upcoming appointments</p>
              <Link to="/doctors" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Book Now
              </Link>
            </div>
          ) : (
            <div className={styles.list}>
              {upcoming.slice(0, 4).map((apt: any) => {
                const cfg = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <Link key={apt._id} to={`/dashboard/appointments/${apt._id}`} className={styles.listItem}>
                    <img
                      src={apt.doctor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctor?.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0`}
                      alt=""
                      className={styles.listAvatar}
                    />
                    <div className={styles.listInfo}>
                      <p className={styles.listName}>{apt.doctor?.user?.name}</p>
                      <p className={styles.listSub}>{apt.doctor?.specialization}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className={styles.listDate}>{format(new Date(apt.scheduledAt), 'MMM d, h:mm a')}</p>
                      <span className={`badge badge-${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Recent Payments</h2>
            <Link to="/dashboard/payments" className={styles.panelLink}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {!payments || payments.length === 0 ? (
            <div className={styles.empty}>
              <CreditCard size={32} className={styles.emptyIcon} />
              <p>No payment history</p>
            </div>
          ) : (
            <div className={styles.list}>
              {payments.slice(0, 4).map((p: any) => (
                <div key={p._id} className={styles.listItem}>
                  <img
                    src={p.doctor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.doctor?.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0`}
                    alt=""
                    className={styles.listAvatar}
                  />
                  <div className={styles.listInfo}>
                    <p className={styles.listName}>{p.doctor?.user?.name}</p>
                    <p className={styles.listSub}>{format(new Date(p.payment?.paidAt || p.scheduledAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={styles.listAmount}>${p.payment?.amount}</p>
                    <span className={`badge badge-${p.payment?.status === 'paid' ? 'success' : p.payment?.status === 'refunded' ? 'warning' : 'default'}`}>
                      {p.payment?.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
