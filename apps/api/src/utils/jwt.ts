import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthTokenPayload {
  sub: string;
  role: 'ADMIN';
}

export function signAuthToken(payload: AuthTokenPayload, hours = 24): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: `${hours}h` });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}
