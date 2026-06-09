/**
 * MediAgent AI — Prisma Seed Script
 * Generates realistic demo data: 2 hospitals, 4 departments, 6 doctors, 30 beds, 8 resources
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

async function main() {
  console.log('🌱 Seeding MediAgent AI database...\n');

  // ─── Permissions ─────────────────────────────────────────────
  console.log('Creating permissions...');
  const permissionsList = [
    'PLATFORM_VIEW', 'HOSPITAL_MANAGE', 'USER_MANAGE',
    'PATIENT_CREATE', 'PATIENT_VIEW_QUEUE', 'PATIENT_VIEW_OWN', 'PATIENT_UPDATE_OWN',
    'MEDICAL_NOTES_EDIT', 'BED_MANAGE', 'AGENT_VIEW', 'AGENT_RUN_VIEW', 'RESOURCE_MANAGE'
  ];

  await Promise.all(
    permissionsList.map(action =>
      prisma.permission.upsert({
        where: { id: `perm-${action.toLowerCase()}` },
        update: { action },
        create: { id: `perm-${action.toLowerCase()}`, action }
      })
    )
  );

  const perms = await prisma.permission.findMany();
  const getPermIds = (actions) => perms.filter(p => actions.includes(p.action)).map(p => ({ id: p.id }));

  // ─── Roles ───────────────────────────────────────────────────
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: { permissions: { set: getPermIds(['PLATFORM_VIEW', 'HOSPITAL_MANAGE', 'USER_MANAGE', 'AGENT_VIEW', 'AGENT_RUN_VIEW']) } },
      create: { name: 'SUPER_ADMIN', permissions: { connect: getPermIds(['PLATFORM_VIEW', 'HOSPITAL_MANAGE', 'USER_MANAGE', 'AGENT_VIEW', 'AGENT_RUN_VIEW']) } }
    }),
    prisma.role.upsert({
      where: { name: 'HOSPITAL_ADMIN' },
      update: { permissions: { set: getPermIds(['HOSPITAL_MANAGE', 'USER_MANAGE', 'PATIENT_CREATE', 'PATIENT_VIEW_QUEUE', 'BED_MANAGE', 'AGENT_VIEW', 'AGENT_RUN_VIEW', 'RESOURCE_MANAGE']) } },
      create: { name: 'HOSPITAL_ADMIN', permissions: { connect: getPermIds(['HOSPITAL_MANAGE', 'USER_MANAGE', 'PATIENT_CREATE', 'PATIENT_VIEW_QUEUE', 'BED_MANAGE', 'AGENT_VIEW', 'AGENT_RUN_VIEW', 'RESOURCE_MANAGE']) } }
    }),
    prisma.role.upsert({
      where: { name: 'DOCTOR' },
      update: { permissions: { set: getPermIds(['PATIENT_VIEW_OWN', 'PATIENT_UPDATE_OWN', 'MEDICAL_NOTES_EDIT']) } },
      create: { name: 'DOCTOR', permissions: { connect: getPermIds(['PATIENT_VIEW_OWN', 'PATIENT_UPDATE_OWN', 'MEDICAL_NOTES_EDIT']) } }
    }),
    prisma.role.upsert({
      where: { name: 'RECEPTIONIST' },
      update: { permissions: { set: getPermIds(['PATIENT_CREATE', 'PATIENT_VIEW_QUEUE', 'BED_MANAGE']) } },
      create: { name: 'RECEPTIONIST', permissions: { connect: getPermIds(['PATIENT_CREATE', 'PATIENT_VIEW_QUEUE', 'BED_MANAGE']) } }
    }),
  ]);
  const [superAdminRole, adminRole, doctorRole, receptionistRole] = roles;

  // ─── Hospitals ───────────────────────────────────────────────
  console.log('Creating hospitals...');
  const hospital1 = await prisma.hospital.upsert({
    where: { id: 'hospital-city-001' },
    update: {},
    create: {
      id: 'hospital-city-001',
      name: 'City General Hospital',
      address: '123 Medical Drive, Downtown',
      phone: '+1-555-0100',
      email: 'admin@cityhospital.com',
    },
  });

  const hospital2 = await prisma.hospital.upsert({
    where: { id: 'hospital-apex-002' },
    update: {},
    create: {
      id: 'hospital-apex-002',
      name: 'Apex Medical Center',
      address: '456 Health Avenue, Uptown',
      phone: '+1-555-0200',
      email: 'admin@apexmedical.com',
    },
  });

  // ─── Users ───────────────────────────────────────────────────
  console.log('Creating users...');
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Super Admin (cross-hospital)
  await prisma.user.upsert({
    where: { email: 'superadmin@mediagent.ai' },
    update: {},
    create: {
      hospitalId: hospital1.id,
      roleId: superAdminRole.id,
      name: 'Super Admin',
      email: 'superadmin@mediagent.ai',
      passwordHash: hash,
      phone: '+1-555-0001',
    },
  });

  // Hospital 1 Admin
  const adminUser1 = await prisma.user.upsert({
    where: { email: 'admin@cityhospital.com' },
    update: {},
    create: {
      hospitalId: hospital1.id,
      roleId: adminRole.id,
      name: 'Dr. Admin City',
      email: 'admin@cityhospital.com',
      passwordHash: hash,
      phone: '+1-555-0101',
    },
  });

  // Hospital 1 Receptionist
  await prisma.user.upsert({
    where: { email: 'reception@cityhospital.com' },
    update: {},
    create: {
      hospitalId: hospital1.id,
      roleId: receptionistRole.id,
      name: 'Sarah Mitchell',
      email: 'reception@cityhospital.com',
      passwordHash: hash,
      phone: '+1-555-0102',
    },
  });

  // Hospital 1 Doctors
  const doctorUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'dr.sharma@cityhospital.com' },
      update: {},
      create: { hospitalId: hospital1.id, roleId: doctorRole.id, name: 'Dr. Ananya Sharma', email: 'dr.sharma@cityhospital.com', passwordHash: hash, phone: '+1-555-0110' },
    }),
    prisma.user.upsert({
      where: { email: 'dr.patel@cityhospital.com' },
      update: {},
      create: { hospitalId: hospital1.id, roleId: doctorRole.id, name: 'Dr. Raj Patel', email: 'dr.patel@cityhospital.com', passwordHash: hash, phone: '+1-555-0111' },
    }),
    prisma.user.upsert({
      where: { email: 'dr.chen@cityhospital.com' },
      update: {},
      create: { hospitalId: hospital1.id, roleId: doctorRole.id, name: 'Dr. Li Chen', email: 'dr.chen@cityhospital.com', passwordHash: hash, phone: '+1-555-0112' },
    }),
    prisma.user.upsert({
      where: { email: 'dr.williams@cityhospital.com' },
      update: {},
      create: { hospitalId: hospital1.id, roleId: doctorRole.id, name: 'Dr. James Williams', email: 'dr.williams@cityhospital.com', passwordHash: hash, phone: '+1-555-0113' },
    }),
  ]);

  // ─── Departments ─────────────────────────────────────────────
  console.log('Creating departments...');
  const [cardiology, emergency, neurology, general] = await Promise.all([
    prisma.department.upsert({ where: { id: 'dept-cardio-001' }, update: {}, create: { id: 'dept-cardio-001', hospitalId: hospital1.id, name: 'Cardiology' } }),
    prisma.department.upsert({ where: { id: 'dept-emerg-001' }, update: {}, create: { id: 'dept-emerg-001', hospitalId: hospital1.id, name: 'Emergency' } }),
    prisma.department.upsert({ where: { id: 'dept-neuro-001' }, update: {}, create: { id: 'dept-neuro-001', hospitalId: hospital1.id, name: 'Neurology' } }),
    prisma.department.upsert({ where: { id: 'dept-genrl-001' }, update: {}, create: { id: 'dept-genrl-001', hospitalId: hospital1.id, name: 'General Medicine' } }),
  ]);

  // ─── Doctors ─────────────────────────────────────────────────
  console.log('Creating doctor profiles...');
  await Promise.all([
    prisma.doctor.upsert({ where: { userId: doctorUsers[0].id }, update: {}, create: { userId: doctorUsers[0].id, departmentId: cardiology.id, specialization: 'Interventional Cardiology', isAvailable: true, maxWorkload: 10, currentLoad: 3 } }),
    prisma.doctor.upsert({ where: { userId: doctorUsers[1].id }, update: {}, create: { userId: doctorUsers[1].id, departmentId: emergency.id,  specialization: 'Emergency Medicine',         isAvailable: true, maxWorkload: 12, currentLoad: 7 } }),
    prisma.doctor.upsert({ where: { userId: doctorUsers[2].id }, update: {}, create: { userId: doctorUsers[2].id, departmentId: neurology.id,  specialization: 'Neurological Surgery',       isAvailable: false, maxWorkload: 8, currentLoad: 8 } }),
    prisma.doctor.upsert({ where: { userId: doctorUsers[3].id }, update: {}, create: { userId: doctorUsers[3].id, departmentId: general.id,    specialization: 'General Internal Medicine',  isAvailable: true, maxWorkload: 15, currentLoad: 2 } }),
  ]);

  // ─── Beds ────────────────────────────────────────────────────
  console.log('Creating beds...');
  const bedData = [
    // ICU beds
    ...Array.from({ length: 6 }, (_, i) => ({ type: 'ICU',       number: `ICU-${String(i+1).padStart(2,'0')}`, ward: 'ICU Ward', floor: '3rd Floor',   status: i < 4 ? 'OCCUPIED' : 'AVAILABLE' })),
    // Emergency beds
    ...Array.from({ length: 8 }, (_, i) => ({ type: 'EMERGENCY', number: `EM-${String(i+1).padStart(2,'0')}`,  ward: 'Emergency Wing', floor: '1st Floor', status: i < 5 ? 'OCCUPIED' : 'AVAILABLE' })),
    // General beds
    ...Array.from({ length: 16 }, (_, i) => ({ type: 'GENERAL',  number: `GN-${String(i+1).padStart(2,'0')}`,  ward: 'General Ward', floor: '2nd Floor',  status: i < 8 ? 'OCCUPIED' : 'AVAILABLE' })),
  ];

  for (const bed of bedData) {
    await prisma.bed.upsert({
      where: { hospitalId_number: { hospitalId: hospital1.id, number: bed.number } },
      update: { status: bed.status },
      create: { hospitalId: hospital1.id, ...bed },
    });
  }

  // ─── Resources ───────────────────────────────────────────────
  console.log('Creating resources...');
  const resourceData = [
    { name: 'Oxygen Cylinders',    type: 'OXYGEN',     quantity: 12, threshold: 5,  unit: 'cylinders' },
    { name: 'Mechanical Ventilators', type: 'VENTILATOR', quantity: 8,  threshold: 3,  unit: 'units' },
    { name: 'Paracetamol 500mg',   type: 'MEDICINE',   quantity: 500, threshold: 100, unit: 'tablets' },
    { name: 'Amoxicillin 250mg',   type: 'MEDICINE',   quantity: 3,   threshold: 50,  unit: 'vials' }, // intentionally low — triggers alert
    { name: 'Blood Packs (O+)',    type: 'BLOOD',      quantity: 20,  threshold: 8,   unit: 'units' },
    { name: 'Surgical Gloves',     type: 'EQUIPMENT',  quantity: 200, threshold: 50,  unit: 'pairs' },
    { name: 'Defibrillator Units', type: 'EQUIPMENT',  quantity: 4,   threshold: 2,   unit: 'units' },
    { name: 'IV Fluids (Normal Saline)', type: 'MEDICINE', quantity: 45, threshold: 20, unit: 'bags' },
  ];

  for (const resource of resourceData) {
    const existing = await prisma.resource.findFirst({
      where: { hospitalId: hospital1.id, name: resource.name },
    });
    if (!existing) {
      await prisma.resource.create({ data: { hospitalId: hospital1.id, ...resource } });
    }
  }

  // ─── Agent Memory (demo data for impressive demos) ───────────
  console.log('Creating agent memory patterns...');
  const memoryPatterns = [
    { agentName: 'TriageAgent', memoryType: 'PATIENT_TREND', key: 'symptoms:chest_pain:frequency', value: { count: 23, avg_priority: 'HIGH', peak_hour: '14:00' } },
    { agentName: 'BedAllocationAgent', memoryType: 'HOSPITAL_STATE', key: 'icu:avg_occupancy:weekly', value: { monday: 0.82, tuesday: 0.91, wednesday: 0.78, thursday: 0.95, friday: 0.88 } },
    { agentName: 'ResourceAgent', memoryType: 'RESOURCE_PATTERN', key: 'oxygen:weekly_trend', value: { trend: 'declining', avg_daily_usage: 2.3, predicted_depletion_days: 5 } },
    { agentName: 'DoctorAssignAgent', memoryType: 'DOCTOR_PREFERENCE', key: 'dept:cardiology:avg_load', value: { avg_load: 7.2, peak_load: 10, preferred_assignment: 'dr-sharma' } },
    { agentName: 'ManagerAgent', memoryType: 'HOSPITAL_STATE', key: 'critical_events:monthly', value: { total: 14, resolved: 13, escalated: 1, avg_resolution_minutes: 8.4 } },
  ];

  for (const pattern of memoryPatterns) {
    await prisma.agentMemory.upsert({
      where: { hospitalId_agentName_key: { hospitalId: hospital1.id, agentName: pattern.agentName, key: pattern.key } },
      update: { value: pattern.value },
      create: { hospitalId: hospital1.id, ...pattern },
    });
  }

  console.log('\n✅  Seed complete!');
  console.log('\n📋  Demo Login Credentials:');
  console.log('   Super Admin:   superadmin@mediagent.ai / password123');
  console.log('   Hospital Admin: admin@cityhospital.com / password123');
  console.log('   Receptionist:  reception@cityhospital.com / password123');
  console.log('   Doctor:        dr.sharma@cityhospital.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
