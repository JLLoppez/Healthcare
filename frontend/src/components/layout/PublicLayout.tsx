import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import styles from './PublicLayout.module.css';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <div className={styles.root}>
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={`container ${styles.navInner}`}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span>Healing</span>
          </Link>

          <nav className={styles.navLinks}>
            <Link to="/doctors" className={styles.navLink}>Find Doctors</Link>
            <Link to="/#services" className={styles.navLink}>Services</Link>
            <Link to="/#about" className={styles.navLink}>About</Link>
          </nav>

          <div className={styles.navActions}>
            {user ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">
                  Dashboard
                </button>
                <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started <ChevronRight size={14} />
                </Link>
              </>
            )}
          </div>

          <button className={styles.menuBtn} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link to="/doctors" className={styles.mobileLink}>Find Doctors</Link>
              <Link to="/#services" className={styles.mobileLink}>Services</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className={styles.mobileLink}>Dashboard</Link>
                  <button onClick={logout} className={styles.mobileLink}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className={styles.mobileLink}>Sign In</Link>
                  <Link to="/register" className={`${styles.mobileLink} ${styles.mobileLinkAccent}`}>Get Started</Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.logo} style={{ marginBottom: 12 }}>
                <div className={styles.logoIcon}><Activity size={16} /></div>
                <span>Healing</span>
              </div>
              <p className="text-secondary text-sm">Your trusted healthcare platform. Quality care, anytime, anywhere.</p>
            </div>
            <div>
              <p className={styles.footerHeading}>Platform</p>
              <Link to="/doctors" className={styles.footerLink}>Find Doctors</Link>
              <Link to="/register" className={styles.footerLink}>Book Appointment</Link>
            </div>
            <div>
              <p className={styles.footerHeading}>Legal</p>
              <a href="#" className={styles.footerLink}>Privacy Policy</a>
              <a href="#" className={styles.footerLink}>Terms of Service</a>
              <a href="#" className={styles.footerLink}>HIPAA Compliance</a>
            </div>
            <div>
              <p className={styles.footerHeading}>Contact</p>
              <a href="mailto:support@healing.com" className={styles.footerLink}>support@healing.com</a>
              <a href="tel:+18005551234" className={styles.footerLink}>1-800-555-1234</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className="text-muted text-sm">© {new Date().getFullYear()} Healing Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
