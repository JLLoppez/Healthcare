import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Star, Shield, Clock, Video, Pill, Search,
  Activity, Heart, Brain, Eye, Bone, Baby, ChevronRight
} from 'lucide-react';
import { doctorApi } from '@/utils/api';
import styles from './LandingPage.module.css';

const STATS = [
  { value: '50K+', label: 'Patients Served' },
  { value: '1,200+', label: 'Verified Doctors' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Available Support' },
];

const SPECIALTIES = [
  { icon: Heart, label: 'Cardiology', color: '#ef4444' },
  { icon: Brain, label: 'Neurology', color: '#8b5cf6' },
  { icon: Eye, label: 'Ophthalmology', color: '#00d4ff' },
  { icon: Bone, label: 'Orthopedics', color: '#f59e0b' },
  { icon: Baby, label: 'Pediatrics', color: '#00f5a0' },
  { icon: Activity, label: 'General Practice', color: '#ec4899' },
];

const FEATURES = [
  {
    icon: Video,
    title: 'Video Consultations',
    desc: 'HD video calls with your doctor from home. No waiting rooms, no travel.'
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    desc: 'Your health data is encrypted and fully protected under HIPAA regulations.'
  },
  {
    icon: Clock,
    title: 'Same-Day Appointments',
    desc: 'Book and see a doctor within hours. Available 7 days a week.'
  },
  {
    icon: Pill,
    title: 'Digital Prescriptions',
    desc: 'Receive and manage prescriptions digitally. Auto-refill notifications included.'
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function LandingPage() {
  const { data: featuredDoctors } = useQuery({
    queryKey: ['featured-doctors'],
    queryFn: () => doctorApi.getFeatured().then(r => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className={styles.page}>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgGlow1} />
          <div className={styles.heroBgGlow2} />
          <div className={styles.heroGrid} />
        </div>

        <div className={`container ${styles.heroContent}`}>
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className={styles.heroBadgeDot} />
            <span>Now accepting new patients</span>
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Healthcare that
            <br />
            <span className="gradient-text">fits your life</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            Connect with 1,200+ verified specialists via video call or in-person.
            <br className={styles.heroBreak} />
            Book, pay, and get prescriptions — all in one place.
          </motion.p>

          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Link to="/doctors" className="btn btn-primary btn-lg">
              Find a Doctor <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Create Free Account
            </Link>
          </motion.div>

          <motion.div
            className={styles.heroTrust}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className={styles.heroAvatars}>
              {['A','B','C','D'].map((l, i) => (
                <div key={i} className={styles.heroAvatar} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 4 - i }}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div className="stars">
                {[...Array(5)].map((_, i) => <span key={i} className="star filled">★</span>)}
              </div>
              <p className="text-sm text-secondary" style={{ marginTop: 2 }}>Trusted by 50,000+ patients</p>
            </div>
          </motion.div>
        </div>

        {/* Floating cards */}
        <motion.div
          className={`${styles.floatCard} ${styles.floatCard1}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.floatCardIcon}><Video size={16} /></div>
          <div>
            <p className={styles.floatCardLabel}>Next available</p>
            <p className={styles.floatCardValue}>Today, 3:00 PM</p>
          </div>
        </motion.div>

        <motion.div
          className={`${styles.floatCard} ${styles.floatCard2}`}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className={`${styles.floatCardIcon} ${styles.floatCardIconGreen}`}><Shield size={16} /></div>
          <div>
            <p className={styles.floatCardLabel}>HIPAA Certified</p>
            <p className={styles.floatCardValue}>256-bit Encrypted</p>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className={styles.statItem}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true }}
              >
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Specialties ──────────────────────────────────── */}
      <section className={styles.section} id="services">
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className={styles.sectionTag}>Specialties</span>
            <h2 className={styles.sectionTitle}>Expert care in every field</h2>
            <p className={styles.sectionSubtitle}>Browse our network of verified specialists across 20+ medical disciplines.</p>
          </motion.div>

          <div className={styles.specialtiesGrid}>
            {SPECIALTIES.map((s, i) => (
              <motion.div
                key={s.label}
                className={`${styles.specialtyCard} card card-hover`}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true }}
              >
                <div className={styles.specialtyIcon} style={{ background: `${s.color}18`, color: s.color }}>
                  <s.icon size={24} strokeWidth={1.5} />
                </div>
                <p className={styles.specialtyLabel}>{s.label}</p>
                <Link to={`/doctors?specialization=${encodeURIComponent(s.label)}`} className={styles.specialtyLink}>
                  View doctors <ChevronRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/doctors" className="btn btn-secondary">
              View All Specialties <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionDark}`} id="about">
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className={styles.sectionTag}>Why Healing</span>
            <h2 className={styles.sectionTitle}>Built for modern healthcare</h2>
          </motion.div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className={`${styles.featureCard} card`}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true }}
              >
                <div className={styles.featureIcon}>
                  <f.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Doctors ──────────────────────────────── */}
      {featuredDoctors && featuredDoctors.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className={styles.sectionTag}>Top Doctors</span>
              <h2 className={styles.sectionTitle}>Meet our specialists</h2>
            </motion.div>

            <div className={styles.doctorsGrid}>
              {featuredDoctors.slice(0, 3).map((doc: any, i: number) => (
                <motion.div
                  key={doc._id}
                  className={`${styles.doctorCard} card card-hover`}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  custom={i}
                  viewport={{ once: true }}
                >
                  <img
                    src={doc.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0&size=120`}
                    alt={doc.user?.name}
                    className={styles.doctorAvatar}
                  />
                  <div className={styles.doctorInfo}>
                    <h4 className={styles.doctorName}>{doc.user?.name}</h4>
                    <p className={styles.doctorSpec}>{doc.specialization}</p>
                    <div className={styles.doctorMeta}>
                      <span className={styles.doctorRating}>
                        <span className="star filled">★</span> {doc.averageRating?.toFixed(1) || '5.0'}
                        <span className="text-muted"> ({doc.totalReviews || 0})</span>
                      </span>
                      <span className={styles.doctorFee}>${doc.consultationFee}</span>
                    </div>
                    <Link to={`/doctors/${doc._id}`} className={`btn btn-primary btn-sm ${styles.doctorBtn}`}>
                      Book Now
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link to="/doctors" className="btn btn-secondary">
                Browse All Doctors <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className={styles.cta}>
        <div className="container">
          <motion.div
            className={styles.ctaInner}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.ctaBg} />
            <span className={styles.sectionTag}>Get Started Today</span>
            <h2 className={styles.ctaTitle}>Your health journey starts here</h2>
            <p className={styles.ctaSubtitle}>Join thousands of patients getting better care, faster.</p>
            <div className={styles.ctaActions}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/doctors" className="btn btn-secondary btn-lg">
                Browse Doctors
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
