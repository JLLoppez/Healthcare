import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, Star, MapPin, Clock, Video, DollarSign, X } from 'lucide-react';
import { doctorApi } from '@/utils/api';
import styles from './DoctorsPage.module.css';

const SPECIALIZATIONS = [
  'All', 'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
  'Pediatrics', 'Psychiatry', 'Orthopedics', 'Gynecology', 'ENT'
];

const SORT_OPTIONS = [
  { value: '-averageRating', label: 'Top Rated' },
  { value: 'fee_asc', label: 'Price: Low to High' },
  { value: 'fee_desc', label: 'Price: High to Low' },
  { value: 'experience', label: 'Most Experienced' },
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className={styles.starRow}>
      <span className="star filled">★</span>
      <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
      <span className={styles.ratingCount}>({count})</span>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: any }) {
  return (
    <motion.div
      className={styles.doctorCard}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className={styles.cardHeader}>
        <img
          src={doctor.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0&size=200`}
          alt={doctor.user?.name}
          className={styles.avatar}
        />
        <div className={styles.headerInfo}>
          <h3 className={styles.doctorName}>{doctor.user?.name}</h3>
          <p className={styles.specialization}>{doctor.specialization}</p>
          {doctor.hospital?.city && (
            <p className={styles.location}><MapPin size={12} /> {doctor.hospital.city}</p>
          )}
        </div>
        {doctor.isVerified && <span className={styles.verifiedBadge}>✓ Verified</span>}
      </div>

      <div className={styles.cardMeta}>
        <StarRating rating={doctor.averageRating || 0} count={doctor.totalReviews || 0} />
        <span className={styles.experience}><Clock size={12} /> {doctor.experience}yr exp</span>
        {doctor.telemedicineEnabled && (
          <span className={styles.telemedicine}><Video size={12} /> Video</span>
        )}
      </div>

      <p className={styles.bio}>{doctor.bio?.slice(0, 120)}{doctor.bio?.length > 120 ? '...' : ''}</p>

      <div className={styles.cardFooter}>
        <div>
          <span className={styles.fee}>${doctor.consultationFee}</span>
          <span className={styles.feePer}> / consultation</span>
        </div>
        <div className={styles.cardActions}>
          <Link to={`/doctors/${doctor._id}`} className="btn btn-secondary btn-sm">View Profile</Link>
          <Link to={`/dashboard/book/${doctor._id}`} className="btn btn-primary btn-sm">Book Now</Link>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.doctorCard}>
      <div className={styles.cardHeader}>
        <div className={`skeleton ${styles.avatarSkeleton}`} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, width: '80%', margin: '16px 0 8px' }} />
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
    </div>
  );
}

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [sort, setSort] = useState('-averageRating');
  const [telemedicineOnly, setTelemedicineOnly] = useState(false);
  const [maxFee, setMaxFee] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const params: Record<string, any> = {
    sort,
    page,
    limit: 12,
    ...(search && { search }),
    ...(specialization !== 'All' && { specialization }),
    ...(telemedicineOnly && { telemedicine: 'true' }),
    ...(maxFee && { maxFee }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorApi.getAll(params).then(r => r.data),
    keepPreviousData: true,
  } as any);

  const clearFilters = () => {
    setSearch('');
    setSpecialization('All');
    setSort('-averageRating');
    setTelemedicineOnly(false);
    setMaxFee('');
    setPage(1);
  };

  const hasFilters = search || specialization !== 'All' || telemedicineOnly || maxFee;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className="container">
          <motion.h1 className={styles.heroTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Find Your <span className="gradient-text">Perfect Doctor</span>
          </motion.h1>
          <motion.p className={styles.heroSubtitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Browse {data?.total || '1,200+'} verified specialists
          </motion.p>

          {/* Search bar */}
          <motion.div className={styles.searchWrap} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, specialty, condition..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <button className={styles.filterToggle} onClick={() => setShowFilters(f => !f)} aria-label="Toggle filters">
              <Filter size={16} />
              <span>Filters</span>
              {hasFilters && <span className={styles.filterDot} />}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Specialization tabs */}
        <div className={styles.specTabs}>
          {SPECIALIZATIONS.map(s => (
            <button
              key={s}
              className={`${styles.specTab} ${specialization === s ? styles.specTabActive : ''}`}
              onClick={() => { setSpecialization(s); setPage(1); }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <motion.div
            className={styles.filtersPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.filtersGrid}>
              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select
                  className="form-input"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max Fee ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Any price"
                  value={maxFee}
                  onChange={e => setMaxFee(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={telemedicineOnly}
                    onChange={e => setTelemedicineOnly(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <Video size={14} /> Video consultations only
                </label>
              </div>
            </div>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Results header */}
        <div className={styles.resultsHeader}>
          <p className={styles.resultsCount}>
            {isLoading ? 'Loading...' : `${data?.total || 0} doctors found`}
          </p>
        </div>

        {/* Results grid */}
        <div className={styles.grid}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : data?.data?.map((doc: any) => <DoctorCard key={doc._id} doctor={doc} />)
          }
        </div>

        {/* Empty */}
        {!isLoading && (!data?.data || data.data.length === 0) && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No doctors found</p>
            <p>Try adjusting your filters or search term</p>
            {hasFilters && <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={clearFilters}>Clear Filters</button>}
          </div>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>Page {page} of {data.pages}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
