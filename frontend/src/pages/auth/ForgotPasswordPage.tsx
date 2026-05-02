// pages/auth/ForgotPasswordPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg}><div className={styles.bgGlow} /></div>
      <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}><Activity size={16} /></div>
          <span>Healing</span>
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div className={styles.successIcon}><CheckCircle size={28} /></div>
            <h2 className={styles.title}>Check your email</h2>
            <p className={styles.subtitle}>We sent a reset link to <strong>{email}</strong>. Check your inbox.</p>
            <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Reset password</h1>
            <p className={styles.subtitle}>Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className={styles.switchAuth}>
              <Link to="/login" className={styles.switchLink}><ArrowLeft size={14} style={{ display: 'inline' }} /> Back to Sign In</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
