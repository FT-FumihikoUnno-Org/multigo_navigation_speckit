import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && (req.user as any).roles.some((role: any) => role.name === 'Administrator')) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden: requires Administrator role' });
};
