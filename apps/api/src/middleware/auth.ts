import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  role: 'ADMIN';
}
declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser }
}

const COOKIE_NAME = 'gc_auth';

export function withAuth(req: Request, _res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch { /* ignore: unauthenticated */ }
  next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  next();
}
