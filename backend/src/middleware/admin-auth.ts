import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY || 'financeiscooked-admin-2024';
  if (adminKey !== expectedKey) {
    return res.status(401).json({ ok: false, error: 'Admin authentication required' });
  }
  next();
}
