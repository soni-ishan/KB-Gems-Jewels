import mongoose, { Schema, model } from 'mongoose';

export interface IImage { url: string; alt?: string; position?: number; thumbUrl?: string; watermarked?: boolean }
export interface IStone {
  _id: string; title: string; slug: string; sku?: string;
  categoryId?: mongoose.Types.ObjectId;
  species?: string; shape?: string; color?: string; clarity?: string; cut?: string;
  treatment?: string; origin?: string;
  caratTypicalPerPiece?: number; dimensions?: string;
  description?: string; tags?: string[];
  images?: IImage[];
  publishedAt?: Date; createdAt: Date; updatedAt: Date;
}

const ImageSchema = new Schema<IImage>({
  url: { type: String, required: true },
  alt: String, position: Number, thumbUrl: String, watermarked: Boolean
}, { _id: false });

const StoneSchema = new Schema<IStone>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: String,
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  species: String, shape: String, color: String, clarity: String, cut: String,
  treatment: String, origin: String,
  caratTypicalPerPiece: Number, dimensions: String,
  description: String, tags: [String],
  images: [ImageSchema],
  publishedAt: Date
}, { timestamps: true });

StoneSchema.index({ title: 'text', species: 'text', shape: 'text', tags: 'text' });

export const Stone = (mongoose.models.Stone as mongoose.Model<IStone>) || model<IStone>('Stone', StoneSchema);
