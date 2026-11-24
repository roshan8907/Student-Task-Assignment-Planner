import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export class AuthService {
  async register(name: string, email: string, password: string) {
    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters long');
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new AppError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      tokenVersion: 0,
    });

    return this.session(user);
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'Email or password is incorrect');
    }

    return this.session(user);
  }

  async logout(userId: string) {
    // Invalidate all previously issued JWTs by incrementing tokenVersion
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    return { message: 'Logged out successfully, server-side session invalidated' };
  }

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private session(user: any) {
    const token = jwt.sign(
      { email: user.email, tokenVersion: user.tokenVersion ?? 0 },
      env.jwtSecret,
      {
        subject: user._id.toString(),
        expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
      }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
