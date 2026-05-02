// src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// Mock axios
vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  doctorApi: {
    getAll: vi.fn(),
    getOne: vi.fn(),
    getFeatured: vi.fn(),
    getSpecializations: vi.fn(),
    getAvailability: vi.fn(),
  },
  appointmentApi: {
    getAll: vi.fn(),
    getOne: vi.fn(),
    getUpcoming: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
  reviewApi: { getDoctorReviews: vi.fn() },
  paymentApi: { createIntent: vi.fn(), getHistory: vi.fn() },
  prescriptionApi: { getAll: vi.fn() },
  adminApi: { getStats: vi.fn(), getUsers: vi.fn() },
}));

// Global React for JSX
import React from 'react';
(global as any).React = React;
