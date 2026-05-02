import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  if (err instanceof Error) {
    res.status(500).json({ success: false, message: err.message });
  } else {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
