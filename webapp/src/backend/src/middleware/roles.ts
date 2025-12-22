import { Request, Response, NextFunction } from 'express';

export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user is populated by Passport.js after successful authentication
    if (req.user && (req.user as any).role === roleName) {
      next();
    } else {
      res.status(403).send('Forbidden: Insufficient role');
    }
  };
};
