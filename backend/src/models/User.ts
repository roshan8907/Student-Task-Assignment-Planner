import mongoose, { Schema, InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 }, // For server-side JWT revocation on logout
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export type UserDoc = InferSchemaType<typeof userSchema> &
  mongoose.Document & {
    tokenVersion: number;
    verifyPassword(password: string): Promise<boolean>;
  };

export const User = mongoose.model('User', userSchema);
