import mongoose, { Schema, model } from 'mongoose';

export type UserRole = 'ADMIN';

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN'], default: 'ADMIN', index: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

// Use mongoose.models to avoid model recompile in dev
export const User = (mongoose.models.User as mongoose.Model<IUser>) || model<IUser>('User', UserSchema);
