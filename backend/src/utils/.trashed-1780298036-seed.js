// backend/src/utils/seed.js
// Run: node src/utils/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { Review } = require('../models/ReviewPrescription');

const DOCTORS_DATA = [
  {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@healing.com',
    specialization: 'Cardiology',
    experience: 12,
    fee: 150,
    bio: 'Board-certified cardiologist specializing in preventive cardiology and heart failure management. Former Chief of Cardiology at Johns Hopkins.',
    languages: ['English', 'Mandarin'],
    city: 'New York',
    rating: 4.9,
  },
  {
    name: 'Dr. Marcus Williams',
    email: 'marcus.williams@healing.com',
    specialization: 'Neurology',
    experience: 15,
    fee: 175,
    bio: 'Neurologist with expertise in stroke, epilepsy, and movement disorders. Published author of 40+ peer-reviewed papers.',
    languages: ['English', 'Spanish'],
    city: 'Los Angeles',
    rating: 4.8,
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@healing.com',
    specialization: 'Dermatology',
    experience: 8,
    fee: 120,
    bio: 'Dermatologist specializing in cosmetic and medical dermatology, with a focus on skin cancer detection and treatment.',
    languages: ['English', 'Hindi'],
    city: 'Chicago',
    rating: 4.7,
  },
  {
    name: 'Dr. James O\'Brien',
    email: 'james.obrien@healing.com',
    specialization: 'General Practice',
    experience: 20,
    fee: 90,
    bio: 'Family physician committed to whole-person care. Trusted by patients for over two decades. Same-day appointments available.',
    languages: ['English'],
    city: 'Boston',
    rating: 4.9,
  },
  {
    name: 'Dr. Amara Osei',
    email: 'amara.osei@healing.com',
    specialization: 'Pediatrics',
    experience: 10,
    fee: 110,
    bio: 'Pediatrician dedicated to children\'s health from newborn through adolescence. Special interest in developmental pediatrics.',
    languages: ['English', 'French'],
    city: 'Atlanta',
    rating: 4.8,
  },
  {
    name: 'Dr. Elena Vasquez',
    email: 'elena.vasquez@healing.com',
    specialization: 'Psychiatry',
    experience: 11,
    fee: 160,
    bio: 'Psychiatrist specializing in anxiety, depression, and mood disorders. Evidence-based treatment combining therapy and medication management.',
    languages: ['English', 'Spanish'],
    city: 'Miami',
    rating: 4.9,
  },
];

const AVAILABILITY = [1, 2, 3, 4, 5].map(day => ({
  dayOfWeek: day,
  startTime: '09:00',
  endTime: '17:00',
  isAvailable: true,
}));

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({ role: { $in: ['patient', 'doctor'] } });
    await Doctor.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Cleared existing seed data');

    // Create admin
    const adminExists = await User.findOne({ email: 'admin@healing.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@healing.com',
        password: 'Admin1234!',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('👑 Admin created: admin@healing.com / Admin1234!');
    }

    // Create demo patient
    const patient = await User.create({
      name: 'Alex Johnson',
      email: 'patient@healing.com',
      password: 'Patient1234!',
      role: 'patient',
      isEmailVerified: true,
      isActive: true,
      phone: '+1 555 000 0001',
      bloodType: 'O+',
      dateOfBirth: new Date('1990-05-15'),
    });
    console.log('🧑‍💻 Demo patient: patient@healing.com / Patient1234!');

    // Create doctors
    for (const d of DOCTORS_DATA) {
      const user = await User.create({
        name: d.name,
        email: d.email,
        password: 'Doctor1234!',
        role: 'doctor',
        isEmailVerified: true,
        isActive: true,
        phone: '+1 555 000 000' + (DOCTORS_DATA.indexOf(d) + 2),
      });

      await Doctor.create({
        user: user._id,
        specialization: d.specialization,
        licenseNumber: `LIC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        experience: d.experience,
        consultationFee: d.fee,
        bio: d.bio,
        languages: d.languages,
        isVerified: true,
        isAcceptingPatients: true,
        telemedicineEnabled: true,
        inPersonEnabled: true,
        featured: true,
        slotDuration: 30,
        breakDuration: 10,
        availability: AVAILABILITY,
        hospital: {
          name: `${d.city} Medical Center`,
          city: d.city,
          country: 'USA',
        },
        education: [{
          degree: 'MD',
          institution: 'Harvard Medical School',
          year: new Date().getFullYear() - d.experience - 4,
        }],
        averageRating: d.rating,
        totalReviews: Math.floor(Math.random() * 100) + 20,
        totalPatients: Math.floor(Math.random() * 500) + 100,
      });

      console.log(`👨‍⚕️  Created: ${d.name} (${d.specialization})`);
    }

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────────');
    console.log('Admin:    admin@healing.com / Admin1234!');
    console.log('Patient:  patient@healing.com / Patient1234!');
    console.log('Doctors:  *@healing.com / Doctor1234!');
    console.log('─────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
