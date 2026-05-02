// pages/DoctorProfilePage.tsx
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, MapPin, Video, Clock, Shield, Award, Calendar, MessageSquare, ChevronLeft, ThumbsUp } from 'lucide-react';
import { doctorApi, reviewApi } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import styles from './DoctorProfilePage.module.css';

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= Math.floor(rating) ? 'filled' : i - 0.5 <= rating ? 'half' : ''}`} style={{ fontSize: size }}>★</span>
      ))}
    </div>
  );
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');

  const { data: doctorData, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorApi.getOne(id!).then(r => r.data.data),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewApi.getDoctorReviews(id!).then(r => r.data),
    enabled: activeTab === 'reviews',
  });

  if (isLoading) return (
    <div style={{ padding: '120px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 200, borderRadius: 16, maxWidth: 800, margin: '0 auto' }} />
    </div>
  );

  if (!doctorData) return (
    <div style={{ padding: '120px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Doctor not found. <Link to="/doctors" style={{ color: 'var(--accent-primary)' }}>Back to search</Link>
    </div>
  );

  const doc = doctorData;
  const rating = doc.averageRating || 0;

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={`container ${styles.container}`}>
        {/* Back */}
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back to search
        </button>

        <div className={styles.layout}>
          {/* Main */}
          <div className={styles.main}>
            {/* Header card */}
            <motion.div className={`card ${styles.headerCard}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <img
                src={doc.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0&size=300`}
                alt={doc.user?.name}
                className={styles.avatar}
              />
              <div className={styles.headerInfo}>
                <div className={styles.headerTop}>
                  <div>
                    <h1 className={styles.doctorName}>{doc.user?.name}</h1>
                    <p className={styles.specialization}>{doc.specialization}</p>
                    {doc.subSpecializations?.length > 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {doc.subSpecializations.join(' • ')}
                      </p>
                    )}
                  </div>
                  {doc.isVerified && (
                    <div className={styles.verifiedBadge}>
                      <Shield size={14} /> Verified
                    </div>
                  )}
                </div>

                {doc.hospital?.name && (
                  <p className={styles.hospital}><MapPin size={14} /> {doc.hospital.name}, {doc.hospital.city}</p>
                )}

                <div className={styles.ratingRow}>
                  <StarDisplay rating={rating} size={16} />
                  <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
                  <span className={styles.ratingCount}>({doc.totalReviews || 0} reviews)</span>
                </div>

                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>{doc.experience}</span>
                    <span className={styles.statLab}>Years exp</span>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>{doc.totalPatients || 0}+</span>
                    <span className={styles.statLab}>Patients</span>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>{doc.totalReviews || 0}</span>
                    <span className={styles.statLab}>Reviews</span>
                  </div>
                </div>

                <div className={styles.tags}>
                  {doc.telemedicineEnabled && <span className={styles.tag}><Video size={12} /> Video</span>}
                  {doc.inPersonEnabled && <span className={styles.tag}><MapPin size={12} /> In-Person</span>}
                  {doc.languages?.map((l: string) => <span key={l} className={styles.tag}>{l}</span>)}
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {['about', 'reviews'].map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab as any)}
                >
                  {tab === 'about' ? <Award size={15} /> : <MessageSquare size={15} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'reviews' && ` (${doc.totalReviews || 0})`}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <motion.div className={styles.tabContent} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {doc.bio && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 12 }}>About</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>{doc.bio}</p>
                  </div>
                )}
                {doc.education?.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Education</h3>
                    {doc.education.map((e: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < doc.education.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{e.degree}</p>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.institution}</p>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.year}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div className={styles.tabContent} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {!reviewsData?.data?.length ? (
                  <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>No reviews yet</p>
                  </div>
                ) : reviewsData.data.map((r: any) => (
                  <div key={r._id} className={`card ${styles.reviewCard}`}>
                    <div className={styles.reviewHeader}>
                      <img src={r.patient?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.patient?.name || 'P')}&background=1a1a2e&color=00f5a0`}
                        alt="" className={styles.reviewAvatar} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{r.patient?.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <StarDisplay rating={r.rating} />
                      </div>
                    </div>
                    {r.title && <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{r.title}</p>}
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.body}</p>
                    {r.doctorResponse && (
                      <div className={styles.doctorResponse}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>
                          Doctor's Response
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.doctorResponse.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Booking sidebar */}
          <div className={styles.sidebar}>
            <div className={`card ${styles.bookCard}`}>
              <div className={styles.feeRow}>
                <span className={styles.fee}>${doc.consultationFee}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ consultation</span>
              </div>

              <div className={styles.availInfo}>
                <div className={styles.availItem}><Video size={14} /> Video consultation</div>
                {doc.inPersonEnabled && <div className={styles.availItem}><MapPin size={14} /> In-person visit</div>}
                <div className={styles.availItem}><Clock size={14} /> {doc.slotDuration || 30} min sessions</div>
              </div>

              <div className={styles.bookActions}>
                {doc.isAcceptingPatients ? (
                  <Link
                    to={user ? `/dashboard/book/${doc._id}` : '/login'}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Calendar size={16} /> Book Appointment
                  </Link>
                ) : (
                  <button className="btn btn-secondary" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.5 }}>
                    Not accepting patients
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
