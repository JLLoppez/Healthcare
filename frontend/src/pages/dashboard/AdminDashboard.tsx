import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { adminApi } from '@/utils/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

const COLORS = ['#00f5a0', '#00d4ff', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
  });

  const statusData = stats ? Object.entries(stats.appointmentsByStatus || {}).map(([name, value]) => ({ name, value })) : [];

  const trendData = [
    { month: 'Jan', patients: 120, appointments: 340 }, { month: 'Feb', patients: 145, appointments: 420 },
    { month: 'Mar', patients: 160, appointments: 390 }, { month: 'Apr', patients: 195, appointments: 510 },
    { month: 'May', patients: 180, appointments: 480 }, { month: 'Jun', patients: 220, appointments: 560 },
  ];

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Platform overview and management</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/dashboard/admin/doctors" className="btn btn-secondary btn-sm">Manage Doctors</Link>
          <Link to="/dashboard/admin/users" className="btn btn-primary btn-sm">Manage Users</Link>
        </div>
      </div>

      <div className={styles.adminGrid}>
        {[
          { icon: Users, label: 'Total Patients', value: stats?.totalUsers || 0, color: '#00f5a0', link: '/dashboard/admin/users' },
          { icon: UserCheck, label: 'Total Doctors', value: stats?.totalDoctors || 0, color: '#00d4ff', link: '/dashboard/admin/doctors' },
          { icon: Calendar, label: 'Total Appointments', value: stats?.totalAppointments || 0, color: '#8b5cf6', link: '/dashboard/appointments' },
          { icon: DollarSign, label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(0)}`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className={styles.adminStatCard}>
            <div className={styles.adminStatIcon} style={{ background: `${s.color}18`, color: s.color }}><s.icon size={20} /></div>
            <div className={styles.adminStatValue}>{s.value}</div>
            <div className={styles.adminStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {stats?.pendingVerifications > 0 && (
        <div style={{ padding: '14px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            <strong>{stats.pendingVerifications}</strong> doctor(s) pending verification
          </span>
          <Link to="/dashboard/admin/doctors" className="btn btn-warning btn-sm" style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            Review Now
          </Link>
        </div>
      )}

      <div className={styles.grid2}>
        <div className={styles.chartWrap}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Platform Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f5a0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#5a6070', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6070', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }} />
              <Area type="monotone" dataKey="patients" stroke="#00f5a0" strokeWidth={2} fill="url(#patGrad)" name="New Patients" />
              <Area type="monotone" dataKey="appointments" stroke="#00d4ff" strokeWidth={2} fill="url(#aptGrad)" name="Appointments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartWrap}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Appointment Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
