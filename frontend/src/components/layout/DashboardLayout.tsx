import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, LayoutDashboard, Calendar, FileText, CreditCard,
  Users, UserCheck, Settings, LogOut, Menu, X, Video,
  Bell, ChevronDown, Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import styles from './DashboardLayout.module.css';

const patientNav = [
  { icon: LayoutDashboard, label: 'Overview', to: '/dashboard/patient' },
  { icon: Calendar, label: 'Appointments', to: '/dashboard/appointments' },
  { icon: FileText, label: 'Prescriptions', to: '/dashboard/prescriptions' },
  { icon: CreditCard, label: 'Payments', to: '/dashboard/payments' },
  { icon: Settings, label: 'Profile', to: '/dashboard/profile' },
];

const doctorNav = [
  { icon: LayoutDashboard, label: 'Overview', to: '/dashboard/doctor' },
  { icon: Calendar, label: 'Appointments', to: '/dashboard/appointments' },
  { icon: FileText, label: 'Prescriptions', to: '/dashboard/prescriptions' },
  { icon: Settings, label: 'Profile', to: '/dashboard/profile' },
];

const adminNav = [
  { icon: LayoutDashboard, label: 'Overview', to: '/dashboard/admin' },
  { icon: Users, label: 'Users', to: '/dashboard/admin/users' },
  { icon: UserCheck, label: 'Doctors', to: '/dashboard/admin/doctors' },
  { icon: Calendar, label: 'Appointments', to: '/dashboard/appointments' },
  { icon: Settings, label: 'Profile', to: '/dashboard/profile' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'doctor' ? doctorNav : patientNav;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const RoleIcon = user?.role === 'admin' ? Shield : user?.role === 'doctor' ? UserCheck : Users;

  const Sidebar = () => (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <NavLink to="/" className={styles.logo}>
          <div className={styles.logoIcon}><Activity size={16} strokeWidth={2.5} /></div>
          <span>Healing</span>
        </NavLink>
      </div>

      <div className={styles.userCard}>
        <img
          src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0a0a1a&color=00f5a0`}
          alt={user?.name}
          className={styles.userAvatar}
        />
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user?.name}</p>
          <span className={`${styles.userRole} badge badge-${user?.role === 'admin' ? 'danger' : user?.role === 'doctor' ? 'info' : 'success'}`}>
            <RoleIcon size={10} /> {user?.role}
          </span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar */}
      <div className={styles.sidebarDesktop}>
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className={styles.sidebarMobile}
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={18} />
              <span className={styles.notifDot} />
            </button>
            <button className={styles.topbarUser} onClick={() => navigate('/dashboard/profile')}>
              <img
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1a1a2e&color=00f5a0`}
                alt={user?.name}
                className={styles.topbarAvatar}
              />
              <span className={styles.topbarName}>{user?.name?.split(' ')[0]}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
