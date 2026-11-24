import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { User } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication token required'));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as jwt.JwtPayload & {
      tokenVersion?: number;
    };

    if (!payload.sub) {
      return next(new AppError(401, 'Invalid authentication token'));
    }

    // Verify token version on backend to enforce server-side revocation on logout
    if (typeof payload.tokenVersion === 'number') {
      const user = await User.findById(payload.sub).select('tokenVersion');
      if (!user) {
        return next(new AppError(401, 'User account no longer exists'));
      }
      if (user.tokenVersion !== payload.tokenVersion) {
        return next(new AppError(401, 'Session has expired or was logged out'));
      }
    }

    req.userId = payload.sub;
    next();
  } catch {
    return next(new AppError(401, 'Invalid or expired authentication token'));
  }
}
