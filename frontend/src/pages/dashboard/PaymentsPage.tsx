// pages/dashboard/PaymentsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { CreditCard, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { paymentApi } from '@/utils/api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './Dashboard.module.css';

export function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentApi.getHistory().then(r => r.data.data),
  });

  const total = payments?.reduce((s: number, p: any) => s + (p.payment?.amount || 0), 0) || 0;

  // Group by month for chart
  const monthlyData: Record<string, number> = {};
  payments?.forEach((p: any) => {
    const month = format(new Date(p.payment?.paidAt || p.scheduledAt), 'MMM yy');
    monthlyData[month] = (monthlyData[month] || 0) + (p.payment?.amount || 0);
  });
  const chartData = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })).slice(-6);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>Payment history and analytics</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[
          { icon: DollarSign, label: 'Total Spent', value: `$${total.toFixed(0)}`, color: '#00f5a0' },
          { icon: CreditCard, label: 'Transactions', value: payments?.length || 0, color: '#00d4ff' },
          { icon: TrendingUp, label: 'Avg per Visit', value: `$${payments?.length ? (total / payments.length).toFixed(0) : 0}`, color: '#8b5cf6' },
          { icon: RefreshCw, label: 'Refunds', value: payments?.filter((p: any) => p.payment?.status === 'refunded').length || 0, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${s.color}18`, color: s.color }}><s.icon size={20} /></div>
            <div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className={styles.chartWrap}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#5a6070', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6070', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }} formatter={(v: any) => [`$${v}`, 'Spent']} />
              <Bar dataKey="amount" fill="url(#payGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5a0" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.panel}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Transaction History</h3>
        {isLoading ? <div className="skeleton" style={{ height: 200, borderRadius: 12 }} /> : !payments?.length ? (
          <div className={styles.empty}><CreditCard size={36} className={styles.emptyIcon} /><p>No payment history yet</p></div>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Doctor</th><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p._id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={p.doctor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=Dr&background=1a1a2e&color=00f5a0`} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.doctor?.user?.name}</span>
                  </div></td>
                  <td style={{ fontSize: 13 }}>{format(new Date(p.payment?.paidAt || p.scheduledAt), 'MMM d, yyyy')}</td>
                  <td style={{ fontSize: 13 }}>{p.type}</td>
                  <td><span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)' }}>${p.payment?.amount}</span></td>
                  <td><span className={`badge badge-${{ paid: 'success', refunded: 'warning' }[p.payment?.status] || 'default'}`}>{p.payment?.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PaymentsPage;
