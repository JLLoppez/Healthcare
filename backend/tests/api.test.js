const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Appointment = require('../src/models/Appointment');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const createUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test Patient',
    email: 'patient@test.com',
    password: 'Password123!',
    role: 'patient'
  };
  return User.create({ ...defaults, ...overrides });
};

const createDoctor = async () => {
  const user = await createUser({
    name: 'Dr. Smith',
    email: 'doctor@test.com',
    role: 'doctor'
  });
  const doctor = await Doctor.create({
    user: user._id,
    specialization: 'General Practice',
    licenseNumber: 'LIC-12345',
    experience: 10,
    consultationFee: 100,
    isVerified: true,
    isAcceptingPatients: true,
    telemedicineEnabled: true,
    availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }]
  });
  return { user, doctor };
};

const loginAs = async (email = 'patient@test.com', password = 'Password123!') => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
};

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new patient', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@test.com',
        password: 'Password123!'
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.role).toBe('patient');
    });

    it('should reject duplicate email', async () => {
      await createUser();
      const res = await request(app).post('/api/auth/register').send({
        name: 'Another',
        email: 'patient@test.com',
        password: 'Password123!'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject admin self-registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker',
        email: 'hacker@test.com',
        password: 'Password123!',
        role: 'admin'
      });
      expect(res.status).toBe(403);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak',
        email: 'weak@test.com',
        password: '123'
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => { await createUser(); });

    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'patient@test.com',
        password: 'Password123!'
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'patient@test.com',
        password: 'WrongPassword!'
      });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com',
        password: 'Password123!'
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      await createUser();
      const token = await loginAs();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('patient@test.com');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    it('should reject missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});

// ─── Doctor Tests ─────────────────────────────────────────────────────────────
describe('Doctors API', () => {
  describe('GET /api/doctors', () => {
    it('should return list of verified doctors', async () => {
      await createDoctor();
      const res = await request(app).get('/api/doctors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by specialization', async () => {
      await createDoctor();
      const res = await request(app).get('/api/doctors?specialization=General Practice');
      expect(res.status).toBe(200);
      expect(res.body.data.every(d => d.specialization === 'General Practice')).toBe(true);
    });

    it('should paginate results', async () => {
      await createDoctor();
      const res = await request(app).get('/api/doctors?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pages).toBeDefined();
    });
  });

  describe('GET /api/doctors/:id', () => {
    it('should return single doctor', async () => {
      const { doctor } = await createDoctor();
      const res = await request(app).get(`/api/doctors/${doctor._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.specialization).toBe('General Practice');
    });

    it('should 404 for non-existent doctor', async () => {
      const res = await request(app).get('/api/doctors/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });
});

// ─── Appointment Tests ────────────────────────────────────────────────────────
describe('Appointments API', () => {
  let patientToken, doctorId;

  beforeEach(async () => {
    await createUser();
    patientToken = await loginAs();
    const { doctor } = await createDoctor();
    doctorId = doctor._id.toString();
  });

  describe('POST /api/appointments', () => {
    it('should create appointment as patient', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledAt: tomorrow.toISOString(),
          type: 'video',
          reason: 'General checkup'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.appointmentId).toMatch(/^APT-/);
    });

    it('should reject double booking same slot', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);

      const bookingData = {
        doctorId,
        scheduledAt: tomorrow.toISOString(),
        type: 'video',
        reason: 'Checkup'
      };

      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(bookingData);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(bookingData);

      expect(res.status).toBe(409);
    });

    it('should reject appointment creation by doctor role', async () => {
      const doctorToken = await loginAs('doctor@test.com');
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId, scheduledAt: new Date().toISOString(), type: 'video', reason: 'test' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/appointments', () => {
    it('should return patient\'s own appointments', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/appointments');
      expect(res.status).toBe(401);
    });
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
describe('API Health', () => {
  it('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────
describe('Security', () => {
  it('should have CORS headers', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
