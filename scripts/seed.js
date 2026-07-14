require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Branch = require('../server/models/Branch');
const User = require('../server/models/User');
const { hashPassword } = require('../server/lib/auth');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  try {
    for (const name of ['Branch One', 'Branch Two', 'Branch Three']) {
      await Branch.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    }
    console.log('Branches ready.');

    const email = (process.env.SEED_PROPRIETOR_EMAIL || '').toLowerCase().trim();
    const password = process.env.SEED_PROPRIETOR_PASSWORD;
    const fullName = process.env.SEED_PROPRIETOR_NAME || 'Proprietor';

    if (email && password) {
      const existing = await User.findOne({ email });
      if (existing) {
        console.log('Proprietor already exists:', email);
      } else {
        await User.create({
          fullName,
          email,
          passwordHash: await hashPassword(password),
          role: 'proprietor',
          branchId: null,
          mustChangePassword: false,
        });
        console.log('Proprietor created:', email);
      }
    } else {
      console.log('Skipped proprietor (set SEED_PROPRIETOR_EMAIL and SEED_PROPRIETOR_PASSWORD).');
    }

    console.log('Seed complete.');
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
