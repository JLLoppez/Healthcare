# 🏥 Healing — Full-Stack Healthcare Platform

> Production-ready healthcare platform with video consultations, appointment booking, prescriptions, payments, and more. Built with Node.js, Express, MongoDB, and React.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | JWT auth, email verification, password reset, role-based access (patient / doctor / admin) |
| 📅 **Appointment Booking** | Real-time slot availability, date/time picker, reschedule & cancel |
| 📹 **Video Consultations** | HD video calls via Daily.co, full in-browser experience |
| 💊 **Prescriptions** | Digital prescriptions with medication tracking and refill management |
| 💳 **Payments** | Stripe integration, webhooks, refunds, payment history |
| ⭐ **Reviews & Ratings** | Star ratings with category breakdowns, doctor responses |
| 🔍 **Doctor Search** | Full-text search, filter by specialty, fee, rating, availability |
| 🛡️ **Admin Panel** | User management, doctor verification, platform analytics |
| 📧 **Email Notifications** | Appointment confirmations, reminders, password resets |
| 📊 **Analytics** | Revenue charts, appointment trends, platform stats |
| 🧪 **Tests** | Backend API tests (Jest + Supertest) + Frontend component tests (Vitest + RTL) |

---

## 🏗️ Architecture

```
healing-platform/
├── backend/                    # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   ├── middleware/         # Auth, error handling
│   │   └── utils/              # Logger, email, AppError
│   └── tests/                  # Jest + Supertest
├── frontend/                   # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── pages/              # Route-level components
│   │   ├── components/         # Shared UI components
│   │   ├── store/              # Zustand state management
│   │   ├── utils/              # API client (Axios)
│   │   ├── styles/             # Global CSS design system
│   │   └── tests/              # Vitest + Testing Library
│   └── index.html
├── api/                        # Vercel serverless entry
├── vercel.json                 # Deployment config
└── package.json                # Root monorepo scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Stripe account (test mode)
- Daily.co account (free tier)
- Cloudinary account (free tier)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/healing-platform.git
cd healing-platform
npm run install:all
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_32_char_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_EMAIL=your@gmail.com
SMTP_PASSWORD=your_app_password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
DAILY_API_KEY=...
CLIENT_URL=http://localhost:3000
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Add your Stripe publishable key
```

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Run Development

```bash
# From root — starts both backend (port 5000) and frontend (port 3000)
npm run dev
```

Or separately:
```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

### 5. Create Admin User

After registering via the UI, update your user role directly in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend

# Watch mode
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

Backend test coverage includes:
- Auth: register, login, token validation, unauthorized access
- Doctors: listing, filtering, pagination, 404 handling
- Appointments: booking, double-booking prevention, role access
- Security: CORS headers, rate limiting

Frontend test coverage includes:
- Login form: validation, submission, loading states
- Register form: role switching, password validation
- Doctors page: rendering, filtering, skeleton loading
- Dashboard layout: role-based navigation

---

## 🌐 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `/` (leave default)
4. Add all environment variables from `backend/.env.example`
5. Add `VITE_STRIPE_PUBLISHABLE_KEY` as a frontend env var
6. Deploy!

### Stripe Webhooks (Production)

After deploying, configure Stripe webhook:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy webhook secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel env

---

## 📱 User Roles & Flows

### Patient
1. Register → verify email
2. Browse doctors (search, filter by specialty/fee/availability)
3. View doctor profile + reviews
4. Book appointment → select date/time → fill reason → pay via Stripe
5. Join video call at appointment time
6. View prescriptions issued by doctor
7. Leave review after completed appointment
8. Manage payments + refunds history

### Doctor
1. Register → create doctor profile (specialization, license, availability)
2. Wait for admin verification
3. View upcoming appointments dashboard
4. Confirm/cancel/complete appointments
5. Add diagnosis notes + issue prescriptions
6. Respond to patient reviews

### Admin
1. View platform analytics (users, revenue, appointments)
2. Verify doctor applications
3. Activate/deactivate users
4. Monitor all appointments

---

## 🔒 Security Features

- JWT tokens with HTTP-only cookies
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min global, 10 req/15min auth)
- Helmet.js security headers
- MongoDB injection sanitization
- CORS with explicit origin whitelist
- Input validation on all routes
- Role-based access control (RBAC)
- Stripe webhook signature verification

---

## 🎨 Design System

The UI uses a **2026 dark luxury healthcare** aesthetic:
- **Primary**: `#00f5a0` (mint green) → trust, health
- **Secondary**: `#00d4ff` (cyan) → technology, clarity
- **Background**: `#050508` (near-black) → premium, focused
- **Typography**: Sora (headings) + DM Sans (body) + JetBrains Mono (code)
- **Animations**: Framer Motion with spring physics
- **Components**: Fully custom CSS Modules (no UI library dependency)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router 6 |
| State | Zustand (auth), TanStack Query (server state) |
| Forms | React Hook Form + Zod validation |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Payments | Stripe |
| Video | Daily.co |
| Email | Nodemailer |
| Images | Cloudinary |
| Tests (BE) | Jest, Supertest, mongodb-memory-server |
| Tests (FE) | Vitest, Testing Library |
| Deploy | Vercel |

---

## 📄 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| PUT | `/api/auth/reset-password/:token` | Reset password |

### Doctors
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | List all (filter, sort, paginate) |
| GET | `/api/doctors/featured` | Featured doctors |
| GET | `/api/doctors/:id` | Doctor profile |
| GET | `/api/doctors/:id/availability` | Available slots |
| POST | `/api/doctors` | Create profile (doctor) |
| PUT | `/api/doctors/:id` | Update profile |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/:id` | Get appointment |
| PATCH | `/api/appointments/:id/status` | Update status |
| PUT | `/api/appointments/:id/reschedule` | Reschedule |
| PATCH | `/api/appointments/:id/notes` | Add doctor notes |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create-intent` | Stripe payment intent |
| POST | `/api/payments/webhook` | Stripe webhook handler |
| GET | `/api/payments/history` | Payment history |

---

## 🐛 Known Limitations

- Video (Daily.co) requires a paid plan for production rooms beyond free tier
- Email sending requires a proper SMTP setup (Gmail app password or SendGrid)
- Stripe is in test mode by default — use test card `4242 4242 4242 4242`

---

## 📝 License

MIT © 2026 Healing Platform
# Healthcare
