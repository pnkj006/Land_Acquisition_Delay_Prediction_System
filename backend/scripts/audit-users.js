/**
 * @fileoverview Audit script: lists all users with non-STAFF roles or elevated permissions.
 * Does NOT modify anything. Output is for human review.
 *
 * Usage:
 *   Set DATABASE_URL in your environment, then:
 *   node scripts/audit-users.js
 *
 *   Or against the dev DB:
 *   DATABASE_URL=<your-dev-url> node scripts/audit-users.js
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { permissions: true },
    orderBy: { role: 'asc' },
  });

  const flagged = users.filter(
    (u) => u.role !== 'STAFF' || u.permissions.length > 0
  );

  console.log('\n=== USER AUDIT REPORT ===');
  console.log(`Total users: ${users.length}`);
  console.log(`Flagged (non-STAFF or has extra permissions): ${flagged.length}\n`);

  for (const u of flagged) {
    const grants = u.permissions.map((p) => `${p.resource}:${p.action}`).join(', ');
    console.log(`  id=${u.id}  email=${u.email}  role=${u.role}  is_active=${u.is_active}  grants=[${grants || 'none'}]`);
  }

  if (flagged.length === 0) {
    console.log('  No flagged users. All non-seed users are STAFF with no extra grants.');
  }

  console.log('\n=== ADMINS ===');
  const admins = users.filter((u) => u.role === 'ADMIN');
  if (admins.length === 0) {
    console.log('  WARNING: No ADMIN users found. Run the seed script first.');
  } else {
    for (const a of admins) {
      console.log(`  id=${a.id}  email=${a.email}  is_active=${a.is_active}`);
    }
  }

  console.log('\n  Action: No changes were made. Review the above and respond.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
