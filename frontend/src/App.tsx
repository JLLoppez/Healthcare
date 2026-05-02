import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// Layout
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Public Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DoctorsPage from '@/pages/DoctorsPage';
import DoctorProfilePage from '@/pages/DoctorProfilePage';

// Dashboard Pages
import PatientDashboard from '@/pages/dashboard/PatientDashboard';
import DoctorDashboard from '@/pages/dashboard/DoctorDashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import AppointmentsPage from '@/pages/dashboard/AppointmentsPage';
import AppointmentDetailPage from '@/pages/dashboard/AppointmentDetailPage';
import BookAppointmentPage from '@/pages/dashboard/BookAppointmentPage';
import PrescriptionsPage from '@/pages/dashboard/PrescriptionsPage';
import VideoCallPage from '@/pages/dashboard/VideoCallPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import PaymentsPage from '@/pages/dashboard/PaymentsPage';
import AdminUsersPage from '@/pages/dashboard/AdminUsersPage';
import AdminDoctorsPage from '@/pages/dashboard/AdminDoctorsPage';
import DoctorProfileEditPage from '@/pages/dashboard/DoctorProfileEditPage'; // NEW

import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

<div style={{ color: "red" }}>
  API URL: {import.meta.env.VITE_API_URL}
</div>

// Route Guards
const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const DashboardRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  if (user.role === 'doctor') return <Navigate to="/dashboard/doctor" replace />;
  return <Navigate to="/dashboard/patient" replace />;
};

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => { fetchMe(); }, [fetchMe]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorProfilePage />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<DashboardRedirect />} />
            <Route path="patient" element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
            <Route path="doctor" element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
            <Route path="admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="admin/users" element={<PrivateRoute roles={['admin']}><AdminUsersPage /></PrivateRoute>} />
            <Route path="admin/doctors" element={<PrivateRoute roles={['admin']}><AdminDoctorsPage /></PrivateRoute>} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="book/:doctorId" element={<PrivateRoute roles={['patient']}><BookAppointmentPage /></PrivateRoute>} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="payments" element={<PrivateRoute roles={['patient']}><PaymentsPage /></PrivateRoute>} />
            <Route path="profile" element={<ProfilePage />} />
            {/* NEW: Doctor profile edit page */}
            <Route
              path="doctor/profile"
              element={<PrivateRoute roles={['doctor']}><DoctorProfileEditPage /></PrivateRoute>}
            />
          </Route>

          {/* Video call - full screen */}
          <Route path="/video/:appointmentId" element={<PrivateRoute><VideoCallPage /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#f8f9ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00f5a0', secondary: '#050508' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#050508' } },
        }}
      />
    </QueryClientProvider>
  );
}
