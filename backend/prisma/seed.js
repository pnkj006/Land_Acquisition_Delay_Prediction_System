/**
 * @fileoverview Seeds minimal data to develop/test against.
 * Run with: npx prisma db seed
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sih26017.gov.in' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@sih26017.gov.in',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'r.sharma@sih26017.gov.in' },
    update: {},
    create: {
      name: 'Rajesh Sharma',
      email: 'r.sharma@sih26017.gov.in',
      password_hash: passwordHash,
      role: 'PROJECT_MANAGER',
    },
  });

  const project = await prisma.project.upsert({
    where: { project_id: 'NHAI-OD-2026-01' },
    update: {},
    create: {
      project_id: 'NHAI-OD-2026-01',
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
      administrator_id: admin.id,
      project_manager_id: pm.id,
      manager: pm.name,
      location: 'Khordha - Cuttack Corridor',
      state: 'Odisha',
      district: 'Khordha',
      altitude_m: 45.0,
      latitude: 20.2961,
      longitude: 85.8245,
      delay_status: 'DELAYED',
      delay_days: 120,
      risk_score: 0.82,
    },
  });

  console.log({ admin: admin.email, pm: pm.email, project: project.project_id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });