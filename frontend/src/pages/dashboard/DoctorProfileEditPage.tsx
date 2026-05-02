// pages/dashboard/DoctorProfileEditPage.tsx
// Route: /dashboard/doctor/profile
import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, Shield, Upload, Trash2, Plus, X,
  Save, FileText, Camera, AlertCircle, Loader,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DoctorProfile {
  _id: string;
  specialization: string;
  subSpecializations: string[];
  conditionsTreated: string[];
  bio: string;
  experience: number;
  consultationFee: number;
  followUpFee: number;
  languages: string[];
  hospital: { name: string; city: string; country: string; address: string };
  education: { degree: string; institution: string; year: number }[];
  certifications: { name: string; issuedBy: string; year: number }[];
  certificateDocuments: { _id: string; name: string; url: string; uploadedAt: string }[];
  isVerified: boolean;
  profileVerified: boolean;
  certificatesSubmittedAt: string;
  isAcceptingPatients: boolean;
  telemedicineEnabled: boolean;
  inPersonEnabled: boolean;
  slotDuration: number;
  consultationFeeNote: string;
}

const SPECIALIZATIONS = [
  'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Neurology', 'Oncology', 'Ophthalmology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
  'Radiology', 'Rheumatology', 'Urology', 'Gynecology',
  'ENT', 'Nephrology', 'Hematology', 'Infectious Disease',
];

// ─── VerifiedBadge ────────────────────────────────────────────────────────────
function VerifiedBadge({ verified, certCount }: { verified: boolean; certCount: number }) {
  if (verified) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(0,245,160,0.12)', border: '1px solid rgba(0,245,160,0.35)',
        borderRadius: 10, padding: '8px 16px', color: '#00f5a0',
      }}>
        <CheckCircle size={16} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Profile Verified</span>
        {certCount > 0 && (
          <span style={{ fontSize: 12, opacity: 0.8 }}>· {certCount} document{certCount !== 1 ? 's' : ''}</span>
        )}
      </div>
    );
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 10, padding: '8px 16px', color: '#f59e0b',
    }}>
      <AlertCircle size={16} />
      <span style={{ fontWeight: 700, fontSize: 14 }}>Pending Verification</span>
      <span style={{ fontSize: 12, opacity: 0.8 }}>· Upload certificates to verify</span>
    </div>
  );
}

// ─── TagInput ────────────────────────────────────────────────────────────────
function TagInput({
  label, tags, onChange, placeholder,
}: { label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };

  const remove = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 8, padding: '4px 10px', fontSize: 13, color: '#00d4ff',
          }}>
            {tag}
            <button type="button" onClick={() => remove(tag)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || 'Type and press Enter'}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DoctorProfileEditPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'practice' | 'certificates'>('profile');

  // Local tag state
  const [conditions, setConditions] = useState<string[]>([]);
  const [subSpecs, setSubSpecs] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // ── Fetch my profile ─────────────────────────────────────────────────────
  const { data: doctor, isLoading, error } = useQuery<DoctorProfile>({
    queryKey: ['my-doctor-profile'],
    queryFn: () => api.get('/doctors/me').then(r => r.data.data),
    onSuccess: (d) => {
      setConditions(d.conditionsTreated || []);
      setSubSpecs(d.subSpecializations || []);
      setLanguages(d.languages || []);
      reset({
        specialization: d.specialization,
        bio: d.bio || '',
        experience: d.experience,
        consultationFee: d.consultationFee,
        followUpFee: d.followUpFee || 0,
        slotDuration: d.slotDuration || 30,
        isAcceptingPatients: d.isAcceptingPatients,
        telemedicineEnabled: d.telemedicineEnabled,
        inPersonEnabled: d.inPersonEnabled,
        hospitalName: d.hospital?.name || '',
        hospitalCity: d.hospital?.city || '',
        hospitalCountry: d.hospital?.country || '',
        hospitalAddress: d.hospital?.address || '',
      });
    },
  } as any);

  // ── Form ─────────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm({
    defaultValues: {
      specialization: '',
      bio: '',
      experience: 0,
      consultationFee: 0,
      followUpFee: 0,
      slotDuration: 30,
      isAcceptingPatients: true,
      telemedicineEnabled: true,
      inPersonEnabled: true,
      hospitalName: '',
      hospitalCity: '',
      hospitalCountry: '',
      hospitalAddress: '',
    },
  });

  // ── Save profile mutation ─────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      api.put(`/doctors/${doctor?._id}`, {
        ...data,
        conditionsTreated: conditions,
        subSpecializations: subSpecs,
        languages,
        hospital: {
          name: data.hospitalName,
          city: data.hospitalCity,
          country: data.hospitalCountry,
          address: data.hospitalAddress,
        },
      }),
    onSuccess: () => {
      toast.success('Profile saved successfully!');
      qc.invalidateQueries({ queryKey: ['my-doctor-profile'] });
    },
    onError: () => toast.error('Failed to save profile'),
  });

  // ── Certificate upload ────────────────────────────────────────────────────
  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f, i) => {
      formData.append('certificates', f);
      // Send display name without extension as the cert name
      formData.append(`name_${i}`, f.name.replace(/\.[^.]+$/, ''));
    });
    try {
      const { data } = await api.post('/uploads/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Certificates uploaded!');
      qc.invalidateQueries({ queryKey: ['my-doctor-profile'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Delete certificate ────────────────────────────────────────────────────
  const deleteCertMutation = useMutation({
    mutationFn: (certId: string) => api.delete(`/uploads/certificates/${certId}`),
    onSuccess: () => {
      toast.success('Certificate removed');
      qc.invalidateQueries({ queryKey: ['my-doctor-profile'] });
    },
    onError: () => toast.error('Failed to remove certificate'),
  });

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
    </div>
  );

  if (error) return (
    <div className={styles.page}>
      <div className={styles.panel} style={{ textAlign: 'center', color: '#ef4444' }}>
        <AlertCircle size={40} style={{ marginBottom: 12 }} />
        <p>Could not load your doctor profile. Make sure your profile has been created.</p>
      </div>
    </div>
  );

  const certCount = doctor?.certificateDocuments?.length || 0;
  const isVerified = doctor?.profileVerified || doctor?.isVerified || certCount > 0;

  const TAB_STYLE = (active: boolean) => ({
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: active ? 'var(--accent-primary)' : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header} style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className={styles.title}>My Doctor Profile</h1>
          <p className={styles.subtitle}>Update your speciality, conditions you treat, and verify your credentials</p>
        </div>
        <VerifiedBadge verified={isVerified} certCount={certCount} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {(['profile', 'practice', 'certificates'] as const).map(tab => (
          <button key={tab} style={TAB_STYLE(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'certificates' && <Shield size={14} style={{ marginRight: 6 }} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'certificates' && certCount > 0 && (
              <span style={{ marginLeft: 8, background: isVerified ? '#00f5a0' : '#f59e0b', color: '#050508', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                {certCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(d => saveMutation.mutate(d))}>

        {/* ── TAB: Profile ─────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className={styles.panel} style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Speciality &amp; Expertise</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Primary Specialization *</label>
                  <select {...register('specialization', { required: true })} className="form-input">
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input {...register('experience', { valueAsNumber: true })} type="number" min={0} max={60} className="form-input" />
                </div>
              </div>

              <TagInput
                label="Sub-Specializations"
                tags={subSpecs}
                onChange={setSubSpecs}
                placeholder="e.g. Interventional Cardiology – press Enter"
              />

              {/* ── Conditions Treated (key new feature) ── */}
              <div style={{ marginTop: 8, padding: '16px 20px', background: 'rgba(0,212,255,0.06)', borderRadius: 12, border: '1px solid rgba(0,212,255,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CheckCircle size={16} color="#00d4ff" />
                  <span style={{ fontWeight: 700, color: '#00d4ff' }}>Conditions You Treat</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>– Helps patients find you</span>
                </div>
                <TagInput
                  label=""
                  tags={conditions}
                  onChange={setConditions}
                  placeholder='e.g. "Heart Disease", "Hypertension" – press Enter'
                />
              </div>
            </div>

            <div className={styles.panel} style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Bio</h2>
              <div className="form-group">
                <textarea
                  {...register('bio')}
                  className="form-input"
                  rows={5}
                  placeholder="Write a compelling professional bio for patients..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <TagInput
                label="Languages Spoken"
                tags={languages}
                onChange={setLanguages}
                placeholder='e.g. "Spanish" – press Enter'
              />
            </div>
          </div>
        )}

        {/* ── TAB: Practice ────────────────────────────────────────────────── */}
        {activeTab === 'practice' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className={styles.panel}>
              <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Fees &amp; Scheduling</h2>
              <div className="form-group">
                <label className="form-label">Consultation Fee (USD) *</label>
                <input {...register('consultationFee', { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Fee (USD)</label>
                <input {...register('followUpFee', { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Slot Duration (minutes)</label>
                <select {...register('slotDuration', { valueAsNumber: true })} className="form-input">
                  {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} min</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {[
                  { name: 'isAcceptingPatients', label: 'Accepting New Patients' },
                  { name: 'telemedicineEnabled', label: 'Telemedicine Available' },
                  { name: 'inPersonEnabled', label: 'In-Person Visits' },
                ].map(({ name, label }) => (
                  <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" {...register(name as any)} style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 14 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Hospital / Clinic</h2>
              {[
                { name: 'hospitalName', label: 'Hospital / Clinic Name', placeholder: 'e.g. Mayo Clinic' },
                { name: 'hospitalAddress', label: 'Address', placeholder: '123 Main St' },
                { name: 'hospitalCity', label: 'City', placeholder: 'New York' },
                { name: 'hospitalCountry', label: 'Country', placeholder: 'USA' },
              ].map(({ name, label, placeholder }) => (
                <div key={name} className="form-group">
                  <label className="form-label">{label}</label>
                  <input {...register(name as any)} className="form-input" placeholder={placeholder} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Certificates ─────────────────────────────────────────────── */}
        {activeTab === 'certificates' && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Verification status banner */}
            <div style={{
              padding: '20px 24px',
              borderRadius: 14,
              background: isVerified ? 'rgba(0,245,160,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${isVerified ? 'rgba(0,245,160,0.25)' : 'rgba(245,158,11,0.25)'}`,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {isVerified
                ? <CheckCircle size={36} color="#00f5a0" />
                : <Shield size={36} color="#f59e0b" />
              }
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: isVerified ? '#00f5a0' : '#f59e0b', marginBottom: 4 }}>
                  {isVerified ? '✓ Profile Verified' : 'Verification Pending'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {isVerified
                    ? `Your profile displays a verified badge. ${certCount} document${certCount !== 1 ? 's' : ''} on file.`
                    : 'Upload your medical license and board certifications. Your profile will show "Verified" immediately after upload.'
                  }
                </p>
              </div>
            </div>

            {/* Upload area */}
            <div className={styles.panel}>
              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Upload Certificates</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Accepted: JPG, PNG, WEBP, PDF · Max 10MB per file · Up to 10 files at once
              </p>

              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: '40px 24px', borderRadius: 14,
                border: '2px dashed rgba(0,212,255,0.3)', cursor: uploading ? 'not-allowed' : 'pointer',
                background: 'rgba(0,212,255,0.04)', transition: 'all 0.2s',
                opacity: uploading ? 0.6 : 1,
              }}>
                {uploading
                  ? <Loader size={32} color="#00d4ff" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Upload size={32} color="#00d4ff" />
                }
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, color: '#00d4ff' }}>{uploading ? 'Uploading…' : 'Click to upload files'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Medical license, board certifications, diplomas</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleCertUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Existing documents */}
            {certCount > 0 && (
              <div className={styles.panel}>
                <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Uploaded Documents ({certCount})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {doctor?.certificateDocuments.map(cert => (
                    <div key={cert._id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 16px', background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,245,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} color="#00f5a0" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{cert.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Uploaded {new Date(cert.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {cert.url && (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 12 }}
                          >
                            View
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                          onClick={() => {
                            if (confirm('Remove this certificate?')) {
                              deleteCertMutation.mutate(cert._id);
                            }
                          }}
                          disabled={deleteCertMutation.isPending}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save button (not shown on certificates tab — saves happen per upload) */}
        {activeTab !== 'certificates' && (
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveMutation.isPending || isSubmitting}
            >
              <Save size={15} />
              {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default DoctorProfileEditPage;
