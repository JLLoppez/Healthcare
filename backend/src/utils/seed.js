// backend/src/utils/seed.js
// Run: node src/utils/seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { Review } = require('../models/ReviewPrescription');

// ─── 12 Doctors ──────────────────────────────────────────────────────────────
const DOCTORS_DATA = [
  {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@healing.com',
    specialization: 'Cardiology',
    subSpecializations: ['Interventional Cardiology', 'Heart Failure'],
    conditionsTreated: ['Heart Disease', 'Hypertension', 'Arrhythmia', 'Heart Failure', 'Coronary Artery Disease'],
    experience: 12,
    fee: 150,
    bio: 'Board-certified cardiologist specializing in preventive cardiology and heart failure management. Former Chief of Cardiology at Johns Hopkins.',
    languages: ['English', 'Mandarin'],
    city: 'New York',
    rating: 4.9,
    reviews: 120,
    patients: 540,
  },
  {
    name: 'Dr. Marcus Williams',
    email: 'marcus.williams@healing.com',
    specialization: 'Neurology',
    subSpecializations: ['Stroke Neurology', 'Epilepsy'],
    conditionsTreated: ['Stroke', 'Epilepsy', 'Migraine', 'Parkinson\'s Disease', 'Multiple Sclerosis'],
    experience: 15,
    fee: 175,
    bio: 'Neurologist with expertise in stroke, epilepsy, and movement disorders. Published author of 40+ peer-reviewed papers.',
    languages: ['English', 'Spanish'],
    city: 'Los Angeles',
    rating: 4.8,
    reviews: 98,
    patients: 420,
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@healing.com',
    specialization: 'Dermatology',
    subSpecializations: ['Cosmetic Dermatology', 'Dermato-Oncology'],
    conditionsTreated: ['Acne', 'Eczema', 'Psoriasis', 'Skin Cancer', 'Rosacea', 'Vitiligo'],
    experience: 8,
    fee: 120,
    bio: 'Dermatologist specializing in cosmetic and medical dermatology, with a focus on skin cancer detection and treatment.',
    languages: ['English', 'Hindi'],
    city: 'Chicago',
    rating: 4.7,
    reviews: 85,
    patients: 380,
  },
  {
    name: 'Dr. James O\'Brien',
    email: 'james.obrien@healing.com',
    specialization: 'General Practice',
    subSpecializations: ['Family Medicine', 'Preventive Care'],
    conditionsTreated: ['Flu', 'Diabetes', 'Hypertension', 'Infections', 'Routine Check-ups', 'Chronic Disease Management'],
    experience: 20,
    fee: 90,
    bio: 'Family physician committed to whole-person care. Trusted by patients for over two decades. Same-day appointments available.',
    languages: ['English'],
    city: 'Boston',
    rating: 4.9,
    reviews: 210,
    patients: 890,
  },
  {
    name: 'Dr. Amara Osei',
    email: 'amara.osei@healing.com',
    specialization: 'Pediatrics',
    subSpecializations: ['Developmental Pediatrics', 'Neonatology'],
    conditionsTreated: ['Childhood Asthma', 'ADHD', 'Developmental Delays', 'Vaccinations', 'Ear Infections', 'Growth Disorders'],
    experience: 10,
    fee: 110,
    bio: 'Pediatrician dedicated to children\'s health from newborn through adolescence. Special interest in developmental pediatrics.',
    languages: ['English', 'French'],
    city: 'Atlanta',
    rating: 4.8,
    reviews: 143,
    patients: 610,
  },
  {
    name: 'Dr. Elena Vasquez',
    email: 'elena.vasquez@healing.com',
    specialization: 'Psychiatry',
    subSpecializations: ['Mood Disorders', 'Anxiety Disorders'],
    conditionsTreated: ['Depression', 'Anxiety', 'Bipolar Disorder', 'PTSD', 'OCD', 'Schizophrenia'],
    experience: 11,
    fee: 160,
    bio: 'Psychiatrist specializing in anxiety, depression, and mood disorders. Evidence-based treatment combining therapy and medication management.',
    languages: ['English', 'Spanish'],
    city: 'Miami',
    rating: 4.9,
    reviews: 97,
    patients: 330,
  },
  {
    name: 'Dr. Kwame Asante',
    email: 'kwame.asante@healing.com',
    specialization: 'Orthopedics',
    subSpecializations: ['Sports Medicine', 'Joint Replacement'],
    conditionsTreated: ['ACL Tears', 'Rotator Cuff Injuries', 'Knee Replacement', 'Hip Replacement', 'Fractures', 'Arthritis'],
    experience: 14,
    fee: 200,
    bio: 'Orthopedic surgeon with expertise in sports medicine and joint replacement. Team physician for professional athletes.',
    languages: ['English', 'Twi'],
    city: 'Houston',
    rating: 4.8,
    reviews: 112,
    patients: 460,
  },
  {
    name: 'Dr. Mei Lin',
    email: 'mei.lin@healing.com',
    specialization: 'Gynecology',
    subSpecializations: ['Reproductive Endocrinology', 'Minimally Invasive Surgery'],
    conditionsTreated: ['PCOS', 'Endometriosis', 'Fibroids', 'Infertility', 'Menstrual Disorders', 'Menopause'],
    experience: 9,
    fee: 140,
    bio: 'OB-GYN specializing in reproductive health and minimally invasive procedures. Committed to empowering women through education.',
    languages: ['English', 'Mandarin', 'Cantonese'],
    city: 'San Francisco',
    rating: 4.9,
    reviews: 167,
    patients: 590,
  },
  {
    name: 'Dr. Ravi Patel',
    email: 'ravi.patel@healing.com',
    specialization: 'Gastroenterology',
    subSpecializations: ['Inflammatory Bowel Disease', 'Hepatology'],
    conditionsTreated: ['Crohn\'s Disease', 'Ulcerative Colitis', 'IBS', 'GERD', 'Liver Disease', 'Colorectal Cancer Screening'],
    experience: 13,
    fee: 165,
    bio: 'Gastroenterologist with deep expertise in IBD and liver disease. Pioneer in minimally invasive endoscopic techniques.',
    languages: ['English', 'Gujarati', 'Hindi'],
    city: 'Seattle',
    rating: 4.7,
    reviews: 78,
    patients: 320,
  },
  {
    name: 'Dr. Fatima Al-Rashid',
    email: 'fatima.alrashid@healing.com',
    specialization: 'Endocrinology',
    subSpecializations: ['Diabetes Management', 'Thyroid Disorders'],
    conditionsTreated: ['Type 1 Diabetes', 'Type 2 Diabetes', 'Thyroid Disease', 'Adrenal Disorders', 'Osteoporosis', 'Obesity'],
    experience: 11,
    fee: 155,
    bio: 'Endocrinologist dedicated to helping patients manage complex hormonal conditions. Special focus on diabetes technology and innovation.',
    languages: ['English', 'Arabic'],
    city: 'Dallas',
    rating: 4.8,
    reviews: 134,
    patients: 510,
  },
  {
    name: 'Dr. Thomas Berg',
    email: 'thomas.berg@healing.com',
    specialization: 'Pulmonology',
    subSpecializations: ['Sleep Medicine', 'Critical Care'],
    conditionsTreated: ['Asthma', 'COPD', 'Sleep Apnea', 'Pulmonary Fibrosis', 'Lung Cancer', 'Pneumonia'],
    experience: 16,
    fee: 170,
    bio: 'Pulmonologist and critical care specialist with extensive experience in respiratory diseases and sleep disorders.',
    languages: ['English', 'German'],
    city: 'Denver',
    rating: 4.7,
    reviews: 89,
    patients: 390,
  },
  {
    name: 'Dr. Nkechi Okafor',
    email: 'nkechi.okafor@healing.com',
    specialization: 'Nephrology',
    subSpecializations: ['Chronic Kidney Disease', 'Dialysis'],
    conditionsTreated: ['Chronic Kidney Disease', 'Kidney Stones', 'Glomerulonephritis', 'Hypertensive Nephropathy', 'Dialysis Management'],
    experience: 10,
    fee: 145,
    bio: 'Nephrologist passionate about preventing kidney disease progression and improving quality of life for dialysis patients.',
    languages: ['English', 'Igbo'],
    city: 'Philadelphia',
    rating: 4.8,
    reviews: 102,
    patients: 430,
  },
];

// ─── 11 Patients ──────────────────────────────────────────────────────────────
const PATIENTS_DATA = [
  {
    name: 'Alex Johnson',
    email: 'patient@healing.com',
    phone: '+1 555 000 0001',
    bloodType: 'O+',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    allergies: ['Penicillin'],
    medicalHistory: [{ condition: 'Hypertension', diagnosedDate: new Date('2018-03-01'), notes: 'Managed with medication' }],
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@healing.com',
    phone: '+1 555 100 0002',
    bloodType: 'A+',
    dateOfBirth: '1985-11-22',
    gender: 'female',
    allergies: ['Sulfa drugs'],
    medicalHistory: [{ condition: 'Type 2 Diabetes', diagnosedDate: new Date('2020-06-15'), notes: 'Diet-controlled' }],
  },
  {
    name: 'David Kim',
    email: 'david.kim@healing.com',
    phone: '+1 555 100 0003',
    bloodType: 'B+',
    dateOfBirth: '1992-08-07',
    gender: 'male',
    allergies: [],
    medicalHistory: [],
  },
  {
    name: 'Emma Thompson',
    email: 'emma.thompson@healing.com',
    phone: '+1 555 100 0004',
    bloodType: 'AB-',
    dateOfBirth: '1988-02-14',
    gender: 'female',
    allergies: ['Latex', 'Aspirin'],
    medicalHistory: [{ condition: 'Asthma', diagnosedDate: new Date('2005-09-01'), notes: 'Mild intermittent' }],
  },
  {
    name: 'Carlos Rivera',
    email: 'carlos.rivera@healing.com',
    phone: '+1 555 100 0005',
    bloodType: 'O-',
    dateOfBirth: '1975-06-30',
    gender: 'male',
    allergies: ['NSAIDs'],
    medicalHistory: [{ condition: 'Coronary Artery Disease', diagnosedDate: new Date('2019-01-20'), notes: 'Post-stent placement' }],
  },
  {
    name: 'Aisha Okonkwo',
    email: 'aisha.okonkwo@healing.com',
    phone: '+1 555 100 0006',
    bloodType: 'A-',
    dateOfBirth: '1995-12-03',
    gender: 'female',
    allergies: [],
    medicalHistory: [],
  },
  {
    name: 'Wei Zhang',
    email: 'wei.zhang@healing.com',
    phone: '+1 555 100 0007',
    bloodType: 'B-',
    dateOfBirth: '1980-04-18',
    gender: 'male',
    allergies: ['Codeine'],
    medicalHistory: [{ condition: 'GERD', diagnosedDate: new Date('2016-07-10'), notes: 'On PPI therapy' }],
  },
  {
    name: 'Sofia Müller',
    email: 'sofia.muller@healing.com',
    phone: '+1 555 100 0008',
    bloodType: 'AB+',
    dateOfBirth: '1993-09-25',
    gender: 'female',
    allergies: [],
    medicalHistory: [{ condition: 'Depression', diagnosedDate: new Date('2021-03-05'), notes: 'In therapy and on medication' }],
  },
  {
    name: 'James Osei',
    email: 'james.osei@healing.com',
    phone: '+1 555 100 0009',
    bloodType: 'O+',
    dateOfBirth: '1970-01-11',
    gender: 'male',
    allergies: ['Shellfish'],
    medicalHistory: [{ condition: 'Osteoarthritis', diagnosedDate: new Date('2017-05-22'), notes: 'Right knee, conservative management' }],
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@healing.com',
    phone: '+1 555 100 0010',
    bloodType: 'A+',
    dateOfBirth: '1998-07-19',
    gender: 'female',
    allergies: [],
    medicalHistory: [],
  },
  {
    name: 'Robert Chen',
    email: 'robert.chen@healing.com',
    phone: '+1 555 100 0011',
    bloodType: 'B+',
    dateOfBirth: '1982-03-28',
    gender: 'male',
    allergies: ['Amoxicillin'],
    medicalHistory: [{ condition: 'Hypothyroidism', diagnosedDate: new Date('2015-11-30'), notes: 'On levothyroxine' }],
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

    // Create patients
    for (const p of PATIENTS_DATA) {
      await User.create({
        name: p.name,
        email: p.email,
        password: 'Patient1234!',
        role: 'patient',
        isEmailVerified: true,
        isActive: true,
        phone: p.phone,
        bloodType: p.bloodType,
        dateOfBirth: new Date(p.dateOfBirth),
        gender: p.gender,
        allergies: p.allergies,
        medicalHistory: p.medicalHistory,
      });
      console.log(`🧑‍💼 Patient: ${p.name} (${p.email})`);
    }

    // Create doctors
    for (const [i, d] of DOCTORS_DATA.entries()) {
      const user = await User.create({
        name: d.name,
        email: d.email,
        password: 'Doctor1234!',
        role: 'doctor',
        isEmailVerified: true,
        isActive: true,
        phone: `+1 555 200 ${String(i + 1).padStart(4, '0')}`,
      });

      await Doctor.create({
        user: user._id,
        specialization: d.specialization,
        subSpecializations: d.subSpecializations || [],
        conditionsTreated: d.conditionsTreated || [],
        licenseNumber: `LIC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        licenseExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
        experience: d.experience,
        consultationFee: d.fee,
        followUpFee: Math.round(d.fee * 0.6),
        bio: d.bio,
        languages: d.languages,
        isVerified: true,
        verifiedAt: new Date(),
        isAcceptingPatients: true,
        telemedicineEnabled: true,
        inPersonEnabled: true,
        featured: i < 6, // first 6 are featured
        slotDuration: 30,
        breakDuration: 10,
        availability: AVAILABILITY,
        hospital: {
          name: `${d.city} Medical Center`,
          city: d.city,
          country: 'USA',
        },
        education: [
          {
            degree: 'MD',
            institution: 'Harvard Medical School',
            year: new Date().getFullYear() - d.experience - 4,
          },
        ],
        certifications: [
          {
            name: `Board Certification in ${d.specialization}`,
            issuedBy: 'American Board of Medical Specialties',
            year: new Date().getFullYear() - d.experience + 1,
          },
        ],
        // Certificate documents (simulated - in prod these would be Cloudinary URLs)
        certificateDocuments: [
          {
            name: 'Medical License',
            url: '',
            uploadedAt: new Date(),
          },
          {
            name: 'Board Certification',
            url: '',
            uploadedAt: new Date(),
          },
        ],
        averageRating: d.rating,
        totalReviews: d.reviews || Math.floor(Math.random() * 100) + 20,
        totalPatients: d.patients || Math.floor(Math.random() * 500) + 100,
        tags: [d.specialization.toLowerCase(), ...d.conditionsTreated.slice(0, 3).map(c => c.toLowerCase())],
      });

      console.log(`👨‍⚕️  Doctor: ${d.name} (${d.specialization})`);
    }

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────────────────────');
    console.log(`✅ ${DOCTORS_DATA.length} doctors seeded`);
    console.log(`✅ ${PATIENTS_DATA.length} patients seeded`);
    console.log('─────────────────────────────────────────────────');
    console.log('Admin:    admin@healing.com / Admin1234!');
    console.log('Patients: *@healing.com    / Patient1234!');
    console.log('Doctors:  *@healing.com    / Doctor1234!');
    console.log('─────────────────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
