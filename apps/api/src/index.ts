import express from 'express';
import { env } from './config/env';
import { connectDB } from './lib/db';
import { security } from './middleware/security';
import { httpLogger } from './middleware/logging';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { errorHandler, notFound } from './middleware/errors';

async function main() {
  await connectDB(env.MONGODB_URI);

  const app = express();
  app.disable('x-powered-by');
  app.use(httpLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(...security);

  app.use(healthRoutes);
  app.use('/auth', authRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
