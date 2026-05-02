// pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Activity, ArrowRight, User, Stethoscope } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['patient', 'doctor']),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'patient' },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      toast.success('Account created! Welcome to Healing.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.bgGlow} />
      </div>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}><Activity size={16} /></div>
          <span>Healing</span>
        </Link>

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Join 50,000+ patients and doctors on Healing</p>

        {/* Role selector */}
        <div className={styles.roleSelector}>
          <button
            type="button"
            className={`${styles.roleBtn} ${role === 'patient' ? styles.roleBtnActive : ''}`}
            onClick={() => setValue('role', 'patient')}
          >
            <User size={18} />
            <span>I'm a Patient</span>
          </button>
          <button
            type="button"
            className={`${styles.roleBtn} ${role === 'doctor' ? styles.roleBtnActive : ''}`}
            onClick={() => setValue('role', 'doctor')}
          >
            <Stethoscope size={18} />
            <span>I'm a Doctor</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              {...register('name')}
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder={role === 'doctor' ? 'Dr. Jane Smith' : 'Jane Smith'}
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              {...register('email')}
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input
              {...register('phone')}
              type="tel"
              className="form-input"
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.passwordField}>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <p className={styles.terms}>
            By creating an account, you agree to our{' '}
            <a href="#" className={styles.switchLink}>Terms of Service</a> and{' '}
            <a href="#" className={styles.switchLink}>Privacy Policy</a>.
          </p>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
            {isLoading ? 'Creating account...' : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Already have an account? <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
