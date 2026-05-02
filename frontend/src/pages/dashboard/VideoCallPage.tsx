import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, X } from 'lucide-react';
import { videoApi, appointmentApi } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import styles from './VideoCallPage.module.css';

export default function VideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [callState, setCallState] = useState<'idle' | 'joining' | 'joined' | 'left'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentApi.getOne(appointmentId!).then(r => r.data.data),
  });

  useEffect(() => {
    let frame: any;

    const initCall = async () => {
      if (!appointmentId || callState !== 'idle') return;
      setCallState('joining');

      try {
        // Ensure room exists
        await videoApi.createRoom(appointmentId);
        const { data } = await videoApi.getToken(appointmentId);

        // Dynamically load Daily.co
        const DailyIframe = (await import('@daily-co/daily-js')).default;

        frame = DailyIframe.createFrame(containerRef.current!, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '16px',
          },
        });

        callFrameRef.current = frame;

        frame.on('joined-meeting', () => {
          setCallState('joined');
          timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        });

        frame.on('left-meeting', () => {
          setCallState('left');
          clearInterval(timerRef.current);
        });

        frame.on('error', (e: any) => {
          toast.error(`Video error: ${e.errorMsg}`);
          setCallState('idle');
        });

        await frame.join({ url: data.data.roomUrl, token: data.data.token });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Could not join video call');
        setCallState('idle');
      }
    };

    initCall();

    return () => {
      clearInterval(timerRef.current);
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [appointmentId]);

  const toggleMute = () => {
    callFrameRef.current?.setLocalAudio(isMuted);
    setIsMuted(m => !m);
  };

  const toggleVideo = () => {
    callFrameRef.current?.setLocalVideo(isVideoOff);
    setIsVideoOff(v => !v);
  };

  const leaveCall = async () => {
    await callFrameRef.current?.leave();
    navigate(`/dashboard/appointments/${appointmentId}`);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const other = user?.role === 'patient' ? appointment?.doctor?.user : appointment?.patient;

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.callInfo}>
          {other && (
            <img
              src={other.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name || 'P')}&background=1a1a2e&color=00f5a0`}
              alt="" className={styles.peerAvatar}
            />
          )}
          <div>
            <p className={styles.peerName}>{other?.name || 'Participant'}</p>
            <p className={styles.callStatus}>
              {callState === 'joining' && 'Connecting...'}
              {callState === 'joined' && <><span className={styles.liveIndicator} /> Live · {formatTime(elapsed)}</>}
              {callState === 'idle' && 'Starting call...'}
              {callState === 'left' && 'Call ended'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
            {appointment?.appointmentId}
          </span>
        </div>
      </div>

      {/* Video container */}
      <div className={styles.videoWrap}>
        {callState === 'joining' && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
            <p>Connecting to your consultation...</p>
          </div>
        )}
        {callState === 'left' && (
          <div className={styles.loadingOverlay}>
            <div className={styles.endedIcon}><PhoneOff size={32} /></div>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Call ended</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Duration: {formatTime(elapsed)}</p>
            <button className="btn btn-primary" onClick={() => navigate(`/dashboard/appointments/${appointmentId}`)}>
              Back to Appointment
            </button>
          </div>
        )}
        <div ref={containerRef} className={styles.dailyContainer} style={{ display: callState === 'joined' ? 'block' : 'none' }} />
      </div>

      {/* Controls */}
      {callState !== 'left' && (
        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${isMuted ? styles.controlBtnOff : ''}`}
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            className={`${styles.controlBtn} ${isVideoOff ? styles.controlBtnOff : ''}`}
            onClick={toggleVideo}
            aria-label={isVideoOff ? 'Start video' : 'Stop video'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            <span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>

          <button className={styles.hangupBtn} onClick={leaveCall} aria-label="Leave call">
            <PhoneOff size={22} />
            <span>Leave</span>
          </button>
        </div>
      )}
    </div>
  );
}
