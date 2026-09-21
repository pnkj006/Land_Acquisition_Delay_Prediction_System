require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.riskPrediction.count({
      where: {
        risk_score: { lte: 1 },
        risk_level: { not: 'LOW' },
      },
    });
    console.log(`SCALE_BUG_COUNT=${count}`);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
