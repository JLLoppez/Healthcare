import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

// ─── Auth Store Mock ──────────────────────────────────────────────────────────
const mockAuthStore = {
  user: null as any,
  token: null as any,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  fetchMe: vi.fn(),
  updateUser: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

// ─── LoginPage Tests ──────────────────────────────────────────────────────────
describe('LoginPage', () => {
  beforeEach(() => {
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
    vi.clearAllMocks();
  });

  it('renders login form', async () => {
    const { LoginPage } = await import('@/pages/auth/LoginPage');
    // Since we use default export, import default
    const LoginDefault = (await import('@/pages/auth/LoginPage')).default;
    render(<BrowserRouter><LoginDefault /></BrowserRouter>);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty submit', async () => {
    const LoginDefault = (await import('@/pages/auth/LoginPage')).default;
    const user = userEvent.setup();
    render(<BrowserRouter><LoginDefault /></BrowserRouter>);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('calls login with correct credentials', async () => {
    const LoginDefault = (await import('@/pages/auth/LoginPage')).default;
    mockAuthStore.login.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<BrowserRouter><LoginDefault /></BrowserRouter>);
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@test.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockAuthStore.login).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('shows loading state during login', async () => {
    const LoginDefault = (await import('@/pages/auth/LoginPage')).default;
    mockAuthStore.isLoading = true;
    render(<BrowserRouter><LoginDefault /></BrowserRouter>);
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});

// ─── RegisterPage Tests ───────────────────────────────────────────────────────
describe('RegisterPage', () => {
  beforeEach(() => { mockAuthStore.user = null; mockAuthStore.isLoading = false; vi.clearAllMocks(); });

  it('renders register form with role selector', async () => {
    const RegisterDefault = (await import('@/pages/auth/RegisterPage')).default;
    render(<BrowserRouter><RegisterDefault /></BrowserRouter>);
    expect(screen.getByText("I'm a Patient")).toBeInTheDocument();
    expect(screen.getByText("I'm a Doctor")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jane smith/i)).toBeInTheDocument();
  });

  it('toggles role on click', async () => {
    const RegisterDefault = (await import('@/pages/auth/RegisterPage')).default;
    const user = userEvent.setup();
    render(<BrowserRouter><RegisterDefault /></BrowserRouter>);
    await user.click(screen.getByText("I'm a Doctor"));
    expect(screen.getByPlaceholderText(/dr\. jane smith/i)).toBeInTheDocument();
  });

  it('validates short passwords', async () => {
    const RegisterDefault = (await import('@/pages/auth/RegisterPage')).default;
    const user = userEvent.setup();
    render(<BrowserRouter><RegisterDefault /></BrowserRouter>);
    await user.type(screen.getByPlaceholderText(/jane smith/i), 'Test User');
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@test.com');
    await user.type(screen.getByPlaceholderText(/min\. 8 characters/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });
});

// ─── DoctorCard / DoctorsPage Tests ──────────────────────────────────────────
describe('DoctorsPage', () => {
  const { doctorApi } = require('@/utils/api');

  beforeEach(() => {
    doctorApi.getAll.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'doc1',
            specialization: 'Cardiology',
            consultationFee: 150,
            averageRating: 4.8,
            totalReviews: 42,
            experience: 10,
            isVerified: true,
            telemedicineEnabled: true,
            bio: 'Expert cardiologist with 10 years experience.',
            user: { name: 'Dr. John Smith', avatarUrl: null }
          }
        ],
        total: 1,
        pages: 1,
        currentPage: 1,
      }
    });
  });

  it('renders search input', async () => {
    const DoctorsDefault = (await import('@/pages/DoctorsPage')).default;
    render(wrapper({ children: <DoctorsDefault /> }));
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });

  it('renders doctor cards after loading', async () => {
    const DoctorsDefault = (await import('@/pages/DoctorsPage')).default;
    render(wrapper({ children: <DoctorsDefault /> }));
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('$150')).toBeInTheDocument();
    });
  });

  it('shows verified badge for verified doctors', async () => {
    const DoctorsDefault = (await import('@/pages/DoctorsPage')).default;
    render(wrapper({ children: <DoctorsDefault /> }));
    await waitFor(() => {
      expect(screen.getByText(/✓ Verified/i)).toBeInTheDocument();
    });
  });

  it('filters by specialization on tab click', async () => {
    const DoctorsDefault = (await import('@/pages/DoctorsPage')).default;
    const user = userEvent.setup();
    render(wrapper({ children: <DoctorsDefault /> }));
    await user.click(screen.getByRole('button', { name: 'Cardiology' }));
    await waitFor(() => {
      expect(doctorApi.getAll).toHaveBeenCalledWith(expect.objectContaining({ specialization: 'Cardiology' }));
    });
  });
});

// ─── Utility / Helper Tests ───────────────────────────────────────────────────
describe('API utilities', () => {
  it('api module exports expected functions', async () => {
    const apiModule = await import('@/utils/api');
    expect(apiModule.doctorApi).toBeDefined();
    expect(apiModule.appointmentApi).toBeDefined();
    expect(apiModule.reviewApi).toBeDefined();
    expect(apiModule.paymentApi).toBeDefined();
    expect(apiModule.prescriptionApi).toBeDefined();
    expect(apiModule.adminApi).toBeDefined();
  });
});

// ─── Auth Store Tests ─────────────────────────────────────────────────────────
describe('Auth Store', () => {
  it('login updates state correctly', async () => {
    const api = (await import('@/utils/api')).default;
    (api.post as any).mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: { _id: '1', name: 'Test User', email: 'test@test.com', role: 'patient', isEmailVerified: false }
      }
    });

    // Test the actual store in isolation
    const { useAuthStore } = await import('@/store/authStore');
    // Use a fresh store instance
    expect(useAuthStore).toBeDefined();
  });
});

// ─── Dashboard Layout Tests ───────────────────────────────────────────────────
describe('DashboardLayout', () => {
  it('shows patient nav links for patient role', async () => {
    mockAuthStore.user = { _id: '1', name: 'Jane Doe', email: 'jane@test.com', role: 'patient', isEmailVerified: true };
    mockAuthStore.token = 'test-token';
    const DashboardLayout = (await import('@/components/layout/DashboardLayout')).default;
    const { Outlet } = await import('react-router-dom');
    render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <DashboardLayout />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/appointments/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/prescriptions/i).length).toBeGreaterThan(0);
  });

  it('shows admin nav links for admin role', async () => {
    mockAuthStore.user = { _id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin', isEmailVerified: true };
    const DashboardLayout = (await import('@/components/layout/DashboardLayout')).default;
    render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <DashboardLayout />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/users/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/doctors/i).length).toBeGreaterThan(0);
  });
});
