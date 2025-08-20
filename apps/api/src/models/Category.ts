import mongoose, { Schema, model } from 'mongoose';

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  position: number;
  isVisible: boolean;
  createdAt: Date; updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: String,
  position: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

export const Category = (mongoose.models.Category as mongoose.Model<ICategory>) || model<ICategory>('Category', CategorySchema);
