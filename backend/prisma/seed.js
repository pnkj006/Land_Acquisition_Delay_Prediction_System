/**
 * @fileoverview Seeds minimal data to develop/test against.
 * Idempotent via upsert — safe to re-run.
 * Run with: npx prisma db seed
 *
 * Credentials (dev defaults; override via env vars):
 *   admin@example.com     / Admin@123      (ADMIN)
 *   pm@example.com        / Pm@12345       (PROJECT_MANAGER)
 *   official@example.com  / Official@1     (SENIOR_OFFICIAL)
 *   staff@example.com     / Staff@123      (STAFF)
 *
 * Projects:
 *   SEED-P1 — assigned to PM + Staff
 *   SEED-P2 — assigned to PM only
 *   SEED-P3 — assigned to nobody
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  // ─── Users ───────────────────────────────────────────────────────────────
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable must be set. Please set it and remember to change the admin password after first login.');
  }
  const pmPassword       = process.env.SEED_PM_PASSWORD       || 'Pm@12345';
  const officialPassword = process.env.SEED_OFFICIAL_PASSWORD || 'Official@1';
  const staffPassword    = process.env.SEED_STAFF_PASSWORD    || 'Staff@123';

  const [adminHash, pmHash, officialHash, staffHash] = await Promise.all([
    bcrypt.hash(adminPassword, SALT_ROUNDS),
    bcrypt.hash(pmPassword, SALT_ROUNDS),
    bcrypt.hash(officialPassword, SALT_ROUNDS),
    bcrypt.hash(staffPassword, SALT_ROUNDS),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password_hash: adminHash, role: 'ADMIN', is_active: true },
    create: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password_hash: adminHash,
      role: 'ADMIN',
      is_active: true,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: { password_hash: pmHash, role: 'PROJECT_MANAGER', is_active: true },
    create: {
      name: 'Project Manager',
      email: 'pm@example.com',
      password_hash: pmHash,
      role: 'PROJECT_MANAGER',
      is_active: true,
    },
  });

  const official = await prisma.user.upsert({
    where: { email: 'official@example.com' },
    update: { password_hash: officialHash, role: 'SENIOR_OFFICIAL', is_active: true },
    create: {
      name: 'Senior Official',
      email: 'official@example.com',
      password_hash: officialHash,
      role: 'SENIOR_OFFICIAL',
      is_active: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: { password_hash: staffHash, role: 'STAFF', is_active: true },
    create: {
      name: 'Field Staff',
      email: 'staff@example.com',
      password_hash: staffHash,
      role: 'STAFF',
      is_active: true,
    },
  });

  // ─── Projects ─────────────────────────────────────────────────────────────
  const p1 = await prisma.project.upsert({
    where: { project_id: 'SEED-P1' },
    update: {},
    create: {
      project_id: 'SEED-P1',
      project_type: 'HIGHWAY',
      land_area_hectares: 120.5,
      number_of_affected_families: 340,
      compensation_status: 'PARTIAL',
      approval_timeline_days: 180,
      legal_disputes_count: 4,
      possession_status: 'PARTIAL',
      rehabilitation_progress_pct: 42.5,
      stakeholder_responsiveness: 'MEDIUM',
      historical_performance_score: 0.6,
      location: 'Khordha - Cuttack Corridor',
      state: 'Odisha',
      district: 'Khordha',
      altitude_m: 45.0,
      latitude: 20.2961,
      longitude: 85.8245,
      delay_status: 'DELAYED',
      delay_days: 120,
      risk_score: 82.0,
    },
  });

  const p2 = await prisma.project.upsert({
    where: { project_id: 'SEED-P2' },
    update: {},
    create: {
      project_id: 'SEED-P2',
      project_type: 'RAILWAY',
      land_area_hectares: 85.0,
      number_of_affected_families: 210,
      compensation_status: 'COMPLETE',
      approval_timeline_days: 120,
      legal_disputes_count: 1,
      possession_status: 'COMPLETE',
      rehabilitation_progress_pct: 75.0,
      stakeholder_responsiveness: 'HIGH',
      historical_performance_score: 0.8,
      location: 'Bhubaneswar Corridor',
      state: 'Odisha',
      district: 'Khurdha',
      latitude: 20.2961,
      longitude: 85.8245,
      delay_status: 'ON_TIME',
      delay_days: null,
      risk_score: 35.0,
    },
  });

  const p3 = await prisma.project.upsert({
    where: { project_id: 'SEED-P3' },
    update: {},
    create: {
      project_id: 'SEED-P3',
      project_type: 'IRRIGATION',
      land_area_hectares: 50.0,
      number_of_affected_families: 120,
      compensation_status: 'PENDING',
      approval_timeline_days: 240,
      legal_disputes_count: 8,
      possession_status: 'PENDING',
      rehabilitation_progress_pct: 10.0,
      stakeholder_responsiveness: 'LOW',
      historical_performance_score: 30.0,
      location: 'Puri Canal Zone',
      state: 'Odisha',
      district: 'Puri',
      latitude: 19.8135,
      longitude: 85.8312,
      delay_status: 'DELAYED',
      delay_days: 45,
      risk_score: 91.0,
    },
  });

  // ─── Project Assignments ──────────────────────────────────────────────────
  // SEED-P1: PM + Staff
  await prisma.projectAssignment.upsert({
    where: { project_id_user_id: { project_id: p1.id, user_id: pm.id } },
    update: {},
    create: { project_id: p1.id, user_id: pm.id },
  });
  await prisma.projectAssignment.upsert({
    where: { project_id_user_id: { project_id: p1.id, user_id: staff.id } },
    update: {},
    create: { project_id: p1.id, user_id: staff.id },
  });

  // SEED-P2: PM only
  await prisma.projectAssignment.upsert({
    where: { project_id_user_id: { project_id: p2.id, user_id: pm.id } },
    update: {},
    create: { project_id: p2.id, user_id: pm.id },
  });

  // SEED-P3: nobody

  // ─── Seed risk predictions ────────────────────────────────────────────────
  // ─── Seed risk predictions ────────────────────────────────────────────────

await prisma.riskPrediction.create({
  data: {
    project_id: p1.id,
    prediction: 'Delayed',
    probability: 0.82,
    risk_score: 82.0,
    risk_level: 'HIGH',
    threshold: 0.5,
    risk_factors: [
      'legal_disputes',
      'rehabilitation_progress',
    ],
    model_version: 'seed-v1',
    status: 'DONE',
    finished_at: new Date(),
  },
});

await prisma.riskPrediction.create({
  data: {
    project_id: p2.id,
    prediction: 'On Time',
    probability: 0.35,
    risk_score: 35.0,
    risk_level: 'LOW',
    threshold: 0.5,
    risk_factors: [
      'compensation_status',
    ],
    model_version: 'seed-v1',
    status: 'DONE',
    finished_at: new Date(),
  },
});

await prisma.riskPrediction.create({
  data: {
    project_id: p3.id,
    prediction: 'Delayed',
    probability: 0.91,
    risk_score: 91.0,
    risk_level: 'HIGH',
    threshold: 0.5,
    risk_factors: [
      'legal_disputes',
      'stakeholder_responsiveness',
    ],
    model_version: 'seed-v1',
    status: 'DONE',
    finished_at: new Date(),
  },
});
  // ─── Seed alerts ──────────────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      { project_id: p1.id, type: 'RISK_ALERT', message: 'High risk detected for SEED-P1', severity: 'HIGH', is_read: false },
      { project_id: p2.id, type: 'STATUS_ALERT', message: 'Status update needed for SEED-P2', severity: 'MEDIUM', is_read: false },
      { project_id: p3.id, type: 'RISK_ALERT', message: 'Critical risk for SEED-P3', severity: 'HIGH', is_read: false },
    ],
    skipDuplicates: true,
  });

  // ─── Seed recommendations ─────────────────────────────────────────────────
  await prisma.recommendation.createMany({
    data: [
      { project_id: p1.id, recommendation: 'Resolve legal disputes immediately', priority: 'HIGH', status: 'PENDING' },
      { project_id: p2.id, recommendation: 'Complete rehabilitation milestone', priority: 'MEDIUM', status: 'PENDING' },
      { project_id: p3.id, recommendation: 'Engage stakeholders urgently', priority: 'HIGH', status: 'PENDING' },
    ],
    skipDuplicates: true,
  });

  console.log({
    users: {
      admin: admin.email,
      pm: pm.email,
      official: official.email,
      staff: staff.email,
    },
    projects: {
      p1: p1.project_id,
      p2: p2.project_id,
      p3: p3.project_id,
    },
  });
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
