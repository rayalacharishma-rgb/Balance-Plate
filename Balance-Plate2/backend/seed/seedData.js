require('dotenv').config();
const bcrypt = require('bcryptjs');
const store = require('../storage/excelStore');
const { conditionSeeds, dietPlans } = require('./dietPlansData');

async function seed() {
  await store.loadWorkbook();
  await store.replaceHealthConditions(conditionSeeds);
  await store.replaceDietPlans(dietPlans);

  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
  await store.upsertUserByEmail('admin@balance-plate.com', {
    fullName: 'Balance-Plate Admin',
    username: 'admin',
    email: 'admin@balance-plate.com',
    mobileNumber: '9876543210',
    passwordHash: adminPassword,
    age: 30,
    gender: 'other',
    height: 1.7,
    weight: 70,
    role: 'admin',
    healthConditions: ['general-healthy-diet'],
    currentDietPlan: 'general-healthy-diet-core-plan',
    currentDietAssignedAt: store.now()
  });
  console.log('Seeded Excel workbook:', store.workbookPath);
}

seed().catch(err => { console.error(err); process.exit(1); });
