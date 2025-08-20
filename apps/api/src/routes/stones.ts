import { Router } from 'express';
import { z } from 'zod';
import { v } from '../middleware/validate';
import { adminOnly } from '../middleware/auth';
import { Stone } from '../models/Stone';
import { slugify } from '../utils/slugify';

const router = Router();

const CreateStoneSchema = z.object({
  title: z.string().min(1),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  species: z.string().optional(),
  shape: z.string().optional(),
  color: z.string().optional(),
  clarity: z.string().optional(),
  cut: z.string().optional(),
  treatment: z.string().optional(),
  origin: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
});

router.post('/', adminOnly, v.body(CreateStoneSchema, async (req, res) => {
  const { title, ...rest } = req.body;
  const slug = slugify(title);
  const stone = await Stone.create({ title, slug, ...rest });
  res.status(201).json({ stone });
}));

router.get('/:slug', async (req, res) => {
  const stone = await Stone.findOne({ slug: req.params.slug }).lean();
  if (!stone) return res.status(404).json({ error: 'Not found' });
  res.json({ stone });
});

export default router;
