// pages/auth/ResetPasswordPage.tsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Eye, EyeOff } from 'lucide-react';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
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
        <h1 className={styles.title}>Set new password</h1>
        <p className={styles.subtitle}>Choose a strong password for your account.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className={styles.passwordField}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.passwordToggle} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className={`form-input ${confirm && confirm !== password ? 'error' : ''}`}
              placeholder="Repeat password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
