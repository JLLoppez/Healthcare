// pages/dashboard/DoctorDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Users, Star, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { appointmentApi } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './Dashboard.module.css';

export function DoctorDashboard() {
  const { user } = useAuthStore();
  const { data: upcoming } = useQuery({ queryKey: ['upcoming-appointments'], queryFn: () => appointmentApi.getUpcoming().then(r => r.data.data) });
  const { data: allApts } = useQuery({ queryKey: ['appointments', {}], queryFn: () => appointmentApi.getAll({ limit: 100 }).then(r => r.data.data) });

  const completed = allApts?.filter((a: any) => a.status === 'completed').length || 0;
  const pending = allApts?.filter((a: any) => a.status === 'pending').length || 0;

  const weeklyData = [
    { day: 'Mon', count: 3 }, { day: 'Tue', count: 5 }, { day: 'Wed', count: 2 },
    { day: 'Thu', count: 7 }, { day: 'Fri', count: 4 }, { day: 'Sat', count: 1 }, { day: 'Sun', count: 0 }
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {user?.name?.split(' ').slice(1).join(' ') || user?.name} 👨‍⚕️</h1>
          <p className={styles.subtitle}>Your practice overview</p>
        </div>
        <Link to="/dashboard/appointments" className="btn btn-primary"><Calendar size={16} /> View Schedule</Link>
      </div>
      <div className={styles.statsGrid}>
        {[
          { icon: Calendar, label: 'Upcoming', value: upcoming?.length || 0, color: '#00d4ff' },
          { icon: CheckCircle, label: 'Completed', value: completed, color: '#00f5a0' },
          { icon: Clock, label: 'Pending', value: pending, color: '#f59e0b' },
          { icon: Star, label: 'Rating', value: '4.9', color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${s.color}18`, color: s.color }}><s.icon size={20} /></div>
            <div><div className={styles.statValue}>{s.value}</div><div className={styles.statLabel}>{s.label}</div></div>
          </div>
        ))}
      </div>
      <div className={styles.grid2}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Today's Appointments</h2>
            <Link to="/dashboard/appointments" className={styles.panelLink}>View all <ArrowRight size={14} /></Link>
          </div>
          {!upcoming?.length ? (
            <div className={styles.empty}><Calendar size={32} className={styles.emptyIcon} /><p>No appointments today</p></div>
          ) : (
            <div className={styles.list}>
              {upcoming.slice(0, 5).map((apt: any) => (
                <Link key={apt._id} to={`/dashboard/appointments/${apt._id}`} className={styles.listItem}>
                  <img src={apt.patient?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient?.name || 'P')}&background=1a1a2e&color=00f5a0`} alt="" className={styles.listAvatar} />
                  <div className={styles.listInfo}>
                    <p className={styles.listName}>{apt.patient?.name}</p>
                    <p className={styles.listSub}>{apt.reason?.slice(0, 40)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={styles.listDate}>{format(new Date(apt.scheduledAt), 'h:mm a')}</p>
                    <span className={`badge badge-${{ pending: 'warning', confirmed: 'info' }[apt.status] || 'default'}`}>{apt.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className={styles.chartWrap}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>This Week</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#5a6070', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6070', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="count" fill="url(#docGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
