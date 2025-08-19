import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '../config/env';

export const security = [
  helmet(),
  cors({ origin: env.CORS_ORIGIN, credentials: true }),
  cookieParser(),
];
