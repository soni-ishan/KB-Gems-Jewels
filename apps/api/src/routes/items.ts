import { Router } from 'express';
import { z } from 'zod';
import { v } from '../middleware/validate';
import { adminOnly } from '../middleware/auth';
import { InventoryItem } from '../models/InventoryItem';
import { Stone, IStone } from '../models/Stone';

const router = Router();

const ListQuery = z.object({
  type: z.enum(['LOT','SINGLE']).optional(),
  species: z.string().optional(),
  shape: z.string().optional(),
  availability: z.enum(['available','reserved','sold']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(60).default(12)
});

router.get(
  '/',
  v.query(ListQuery, async (req, res) => {
    const { page, limit, ...filters } = req.query;
    const query: any = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) query[k] = v; });

    const items = await InventoryItem.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await InventoryItem.countDocuments(query);
    res.json({ page, limit, total, items });
  })
);

router.get(
  '/:code',
  async (req, res) => {
    const item = await InventoryItem.findOne({ code: req.params.code }).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ item });
  }
);

const CreateItemSchema = z.object({
  type: z.enum(['LOT','SINGLE']),
  code: z.string().min(1),
  stoneId: z.string().min(1),
  categoryId: z.string().optional(),
  species: z.string().optional(),
  shape: z.string().optional(),
  color: z.string().optional(),
  clarity: z.string().optional(),
  cut: z.string().optional(),
  treatment: z.string().optional(),
  origin: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pieceCount: z.number().optional(),
  caratTotal: z.number().optional(),
  caratSingle: z.number().optional(),
  availability: z.enum(['available','reserved','sold']).default('available')
}).superRefine((val, ctx) => {
  if (val.type === 'SINGLE' && typeof val.caratSingle !== 'number') {
    ctx.addIssue({ code: 'custom', message: 'caratSingle is required for SINGLE', path: ['caratSingle'] });
  }
  if (val.type === 'LOT' && (typeof val.pieceCount !== 'number' || typeof val.caratTotal !== 'number')) {
    ctx.addIssue({ code: 'custom', message: 'pieceCount and caratTotal are required for LOT', path: ['pieceCount'] });
  }
});

router.post(
  '/',
  adminOnly,
  v.body(CreateItemSchema, async (req, res) => {
    const body = req.body;

    // Fill denormalized fields from Stone if missing
    if (!body.species || !body.shape || !body.color || !body.clarity || !body.cut) {
      type Denorm = Pick<IStone, 'species'|'shape'|'color'|'clarity'|'cut'|'treatment'|'origin'|'tags'>;
      const denorm = await Stone.findById(body.stoneId)
        .select('species shape color clarity cut treatment origin tags')
        .lean<Denorm>()
        .exec();

      if (denorm) {
        body.species   ??= denorm.species;
        body.shape     ??= denorm.shape;
        body.color     ??= denorm.color;
        body.clarity   ??= denorm.clarity;
        body.cut       ??= denorm.cut;
        body.treatment ??= denorm.treatment;
        body.origin    ??= denorm.origin;
        body.tags      ??= denorm.tags;
      }
    }

    const item = await InventoryItem.create(body);
    res.status(201).json({ item });
  })
);

export default router;
