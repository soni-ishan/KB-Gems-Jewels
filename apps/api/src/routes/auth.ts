import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signAuthToken, verifyAuthToken } from '../utils/jwt';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const COOKIE_NAME = 'gc_auth';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = signAuthToken({ sub: user.id, role: user.role });
    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res) => {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub).select('email role createdAt updatedAt').lean();
    res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.json({ ok: true });
});

export default router;
