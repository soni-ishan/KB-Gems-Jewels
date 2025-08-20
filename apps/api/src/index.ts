import express from 'express';
import { env } from './config/env';
import { connectDB } from './lib/db';
import { security } from './middleware/security';
import { httpLogger } from './middleware/logging';
import { errorHandler, notFound } from './middleware/errors';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import stonesRoutes from './routes/stones';
import itemsRoutes from './routes/items';
import { withAuth } from './middleware/auth';
import { loginLimiter } from './middleware/ratelimit';

async function main() {
  await connectDB(env.MONGODB_URI);

  const app = express();
  app.disable('x-powered-by');
  app.use(httpLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(...security);
  app.use(withAuth);

  // health
  app.use(healthRoutes);

  // auth (apply rate limit to login only)
  app.use('/auth/login', loginLimiter, (req, res, next) => next());
  app.use('/auth', authRoutes);

  // catalogue
  app.use('/stones', stonesRoutes);
  app.use('/items', itemsRoutes);

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
