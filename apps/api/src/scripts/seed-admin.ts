import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { connectDB } from '../lib/db';
import { User } from '../models/User';

async function run() {
  await connectDB(env.MONGODB_URI);

  const existing = await User.findOne({ email: env.ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', env.ADMIN_EMAIL);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await User.create({ email: env.ADMIN_EMAIL, passwordHash, role: 'ADMIN' });

  console.log('Admin created:', env.ADMIN_EMAIL);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
