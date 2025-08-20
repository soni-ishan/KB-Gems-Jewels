import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodTypeAny } from 'zod';

type Part = 'body' | 'query' | 'params';

function send400(res: Response, err: any) {
  const issues = err?.issues ?? [];
  return res.status(400).json({
    error: 'ValidationError',
    details: issues.map((i: any) => ({ path: Array.isArray(i.path) ? i.path.join('.') : '', message: i.message }))
  });
}

/** Classic middleware (untyped) – still available if you want it */
export function validate<T extends ZodTypeAny>(part: Part, schema: T): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse((req as any)[part]);
    if (!parsed.success) return send400(res, parsed.error);
    (req as any)[part] = parsed.data;
    next();
  };
}

/** Typed wrappers that return a handler with narrowed req types */
export const v = {
  query<T extends ZodTypeAny>(
    schema: T,
    handler: (req: Request<{}, any, any, z.infer<T>>, res: Response, next: NextFunction) => any
  ): RequestHandler {
    return (req, res, next) => {
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) return send400(res, parsed.error);
      (req as any).query = parsed.data;
      Promise.resolve(handler(req as any, res, next)).catch(next);
    };
  },

  body<T extends ZodTypeAny>(
    schema: T,
    handler: (req: Request<{}, any, z.infer<T>, any>, res: Response, next: NextFunction) => any
  ): RequestHandler {
    return (req, res, next) => {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return send400(res, parsed.error);
      (req as any).body = parsed.data;
      Promise.resolve(handler(req as any, res, next)).catch(next);
    };
  },

  params<T extends ZodTypeAny>(
    schema: T,
    handler: (req: Request<z.infer<T>>, res: Response, next: NextFunction) => any
  ): RequestHandler {
    return (req, res, next) => {
      const parsed = schema.safeParse(req.params);
      if (!parsed.success) return send400(res, parsed.error);
      (req as any).params = parsed.data;
      Promise.resolve(handler(req as any, res, next)).catch(next);
    };
  }
};
