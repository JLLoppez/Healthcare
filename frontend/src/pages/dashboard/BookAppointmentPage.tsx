// pages/dashboard/BookAppointmentPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfDay } from 'date-fns';
import { Calendar, Video, MapPin, Clock, ChevronLeft, ChevronRight, CreditCard, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { doctorApi, appointmentApi, paymentApi } from '@/utils/api';
import toast from 'react-hot-toast';
import styles from './BookAppointmentPage.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f8f9ff',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '15px',
      '::placeholder': { color: '#5a6070' },
    },
    invalid: { color: '#ef4444' },
  },
};

type Step = 'datetime' | 'details' | 'payment' | 'confirm';

function PaymentForm({ appointmentId, amount, onSuccess }: { appointmentId: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { data } = await paymentApi.createIntent(appointmentId);
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! }
      });
      if (result.error) throw new Error(result.error.message);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className={styles.paymentForm}>
      <div className={styles.cardElementWrap}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
      <p className={styles.secureNote}><span>🔒</span> Secured by Stripe. Your card details are never stored.</p>
    </form>
  );
}

export default function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('datetime');
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorApi.getOne(doctorId!).then(r => r.data.data),
  });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', doctorId, dateStr],
    queryFn: () => doctorApi.getAvailability(doctorId!, dateStr).then(r => r.data.data),
    enabled: !!doctorId,
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), weekOffset * 7 + i + 1));

  const handleBooking = async () => {
    if (!selectedSlot || !reason.trim()) return toast.error('Please fill in all required fields');
    try {
      const { data } = await appointmentApi.create({
        doctorId,
        scheduledAt: selectedSlot,
        type: consultationType,
        reason,
        symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : [],
      });
      setAppointmentId(data.data._id);
      setStep('payment');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  const handlePaymentSuccess = () => {
    setStep('confirm');
    toast.success('Appointment booked and paid!');
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'datetime', label: 'Date & Time' },
    { key: 'details', label: 'Details' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirm', label: 'Confirmed' },
  ];

  const stepIndex = steps.findIndex(s => s.key === step);

  if (!doctor) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading doctor info...</div>
  );

  return (
    <Elements stripe={stripePromise}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className={styles.title}>Book Appointment</h1>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          {steps.map((s, i) => (
            <div key={s.key} className={styles.progressStep}>
              <div className={`${styles.progressDot} ${i < stepIndex ? styles.done : i === stepIndex ? styles.active : ''}`}>
                {i < stepIndex ? <Check size={12} /> : i + 1}
              </div>
              <span className={`${styles.progressLabel} ${i === stepIndex ? styles.progressLabelActive : ''}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`${styles.progressLine} ${i < stepIndex ? styles.progressLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Main */}
          <div className={styles.main}>
            <AnimatePresence mode="wait">
              {/* Step 1: Date & Time */}
              {step === 'datetime' && (
                <motion.div key="datetime" className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className={styles.stepTitle}><Calendar size={20} /> Select Date</h2>

                  {/* Week navigation */}
                  <div className={styles.weekNav}>
                    <button className={styles.weekBtn} onClick={() => setWeekOffset(o => Math.max(0, o - 1))} disabled={weekOffset === 0}>
                      <ChevronLeft size={16} />
                    </button>
                    <div className={styles.weekDays}>
                      {weekDays.map(day => (
                        <button
                          key={day.toISOString()}
                          className={`${styles.dayBtn} ${format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? styles.dayBtnActive : ''}`}
                          onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                        >
                          <span className={styles.dayName}>{format(day, 'EEE')}</span>
                          <span className={styles.dayNum}>{format(day, 'd')}</span>
                          <span className={styles.dayMonth}>{format(day, 'MMM')}</span>
                        </button>
                      ))}
                    </div>
                    <button className={styles.weekBtn} onClick={() => setWeekOffset(o => o + 1)}>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Time slots */}
                  <h3 className={styles.slotTitle}>
                    <Clock size={16} /> Available slots for {format(selectedDate, 'EEEE, MMMM d')}
                  </h3>

                  {slotsLoading ? (
                    <div className={styles.slotsGrid}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`skeleton ${styles.slotSkeleton}`} />
                      ))}
                    </div>
                  ) : !slotsData?.length ? (
                    <p className={styles.noSlots}>No available slots on this day. Try another date.</p>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {slotsData.map((slot: any) => (
                        <button
                          key={slot.datetime}
                          className={`${styles.slot} ${!slot.available ? styles.slotTaken : ''} ${selectedSlot === slot.datetime ? styles.slotActive : ''}`}
                          onClick={() => slot.available && setSelectedSlot(slot.datetime)}
                          disabled={!slot.available}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.stepActions}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setStep('details')}
                      disabled={!selectedSlot}
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 'details' && (
                <motion.div key="details" className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className={styles.stepTitle}>Appointment Details</h2>

                  {/* Consultation type */}
                  <div className={styles.typeSelector}>
                    <button
                      className={`${styles.typeBtn} ${consultationType === 'video' ? styles.typeBtnActive : ''}`}
                      onClick={() => setConsultationType('video')}
                    >
                      <Video size={20} />
                      <span>Video Call</span>
                      <span className={styles.typeSub}>From home</span>
                    </button>
                    {doctor.inPersonEnabled && (
                      <button
                        className={`${styles.typeBtn} ${consultationType === 'in-person' ? styles.typeBtnActive : ''}`}
                        onClick={() => setConsultationType('in-person')}
                      >
                        <MapPin size={20} />
                        <span>In Person</span>
                        <span className={styles.typeSub}>{doctor.hospital?.city || 'Clinic'}</span>
                      </button>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Reason for visit *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Annual checkup, follow-up, new symptom..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Symptoms (optional, comma-separated)</label>
                    <textarea
                      className="form-input"
                      style={{ resize: 'vertical', minHeight: 80 }}
                      placeholder="e.g. headache, fatigue, fever..."
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                    />
                  </div>

                  <div className={styles.stepActions}>
                    <button className="btn btn-secondary" onClick={() => setStep('datetime')}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button className="btn btn-primary" onClick={handleBooking} disabled={!reason.trim()}>
                      Proceed to Payment <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 'payment' && appointmentId && (
                <motion.div key="payment" className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className={styles.stepTitle}><CreditCard size={20} /> Secure Payment</h2>
                  <div className={styles.paymentSummary}>
                    <div className={styles.paymentRow}>
                      <span>Consultation fee</span>
                      <span>${doctor.consultationFee}</span>
                    </div>
                    <div className={styles.paymentRow}>
                      <span>Platform fee</span>
                      <span>$0</span>
                    </div>
                    <div className={`${styles.paymentRow} ${styles.paymentTotal}`}>
                      <span>Total</span>
                      <span>${doctor.consultationFee}</span>
                    </div>
                  </div>
                  <PaymentForm appointmentId={appointmentId} amount={doctor.consultationFee} onSuccess={handlePaymentSuccess} />
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep('details')} style={{ marginTop: 12 }}>
                    <ChevronLeft size={14} /> Back
                  </button>
                </motion.div>
              )}

              {/* Step 4: Confirmed */}
              {step === 'confirm' && (
                <motion.div key="confirm" className={`card ${styles.confirmCard}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className={styles.confirmIcon}>
                    <Check size={32} />
                  </div>
                  <h2 className={styles.confirmTitle}>Appointment Confirmed!</h2>
                  <p className={styles.confirmSubtitle}>
                    Your appointment with <strong>{doctor.user?.name}</strong> on{' '}
                    <strong>{selectedSlot ? format(new Date(selectedSlot), 'EEEE, MMMM d, yyyy \'at\' h:mm a') : ''}</strong> has been booked.
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
                    A confirmation email has been sent to your registered email address.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard/appointments')}>
                      View Appointments
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/doctors')}>
                      Book Another
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: Doctor summary */}
          <div className={styles.sidebar}>
            <div className="card">
              <p className={styles.sidebarLabel}>Booking with</p>
              <div className={styles.docSummary}>
                <img
                  src={doctor.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user?.name || 'Dr')}&background=1a1a2e&color=00f5a0`}
                  alt="" className={styles.docAvatar}
                />
                <div>
                  <p className={styles.docName}>{doctor.user?.name}</p>
                  <p className={styles.docSpec}>{doctor.specialization}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span className="star filled" style={{ fontSize: 13 }}>★</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{doctor.averageRating?.toFixed(1)} ({doctor.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

              {selectedSlot && (
                <div className={styles.selectedSlotInfo}>
                  <div className={styles.slotInfoRow}><Calendar size={14} /> {format(new Date(selectedSlot), 'EEEE, MMMM d, yyyy')}</div>
                  <div className={styles.slotInfoRow}><Clock size={14} /> {format(new Date(selectedSlot), 'h:mm a')}</div>
                  <div className={styles.slotInfoRow}>
                    {consultationType === 'video' ? <Video size={14} /> : <MapPin size={14} />}
                    {consultationType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                  </div>
                </div>
              )}

              <div className={styles.feeSummary}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Consultation fee</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>${doctor.consultationFee}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Elements>
  );
}
