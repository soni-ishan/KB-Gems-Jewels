import mongoose, { Schema, model } from 'mongoose';

export type ItemType = 'LOT'|'SINGLE';
export type Availability = 'available'|'reserved'|'sold';

export interface ICert { lab?: string; number?: string; issueDate?: Date; pdfUrl?: string }
export interface IImage { url: string; alt?: string; position?: number; thumbUrl?: string; watermarked?: boolean }

export interface IInventoryItem {
  _id: string;
  type: ItemType;
  code: string;                  // unique
  stoneId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;

  // denorm from stone for fast filters
  species?: string; shape?: string; color?: string; clarity?: string; cut?: string;
  treatment?: string; origin?: string; tags?: string[];

  // quantities
  pieceCount?: number;   // LOT
  caratTotal?: number;   // LOT
  caratSingle?: number;  // SINGLE

  location?: string;
  availability: Availability;
  featured?: boolean;

  images?: IImage[];
  certificates?: ICert[];
  publishedAt?: Date;
  createdAt: Date; updatedAt: Date;
}

const ImageSchema = new Schema<IImage>({
  url: { type: String, required: true },
  alt: String, position: Number, thumbUrl: String, watermarked: Boolean
}, { _id: false });

const CertSchema = new Schema<ICert>({
  lab: String, number: String, issueDate: Date, pdfUrl: String
}, { _id: false });

const ItemSchema = new Schema<IInventoryItem>({
  type: { type: String, enum: ['LOT','SINGLE'], required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  stoneId: { type: Schema.Types.ObjectId, ref: 'Stone', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },

  species: String, shape: String, color: String, clarity: String, cut: String,
  treatment: String, origin: String, tags: [String],

  pieceCount: Number, caratTotal: Number, caratSingle: Number,

  location: String,
  availability: { type: String, enum: ['available','reserved','sold'], default: 'available', index: true },
  featured: Boolean,

  images: [ImageSchema],
  certificates: [CertSchema],
  publishedAt: Date
}, { timestamps: true });

ItemSchema.index({ type: 1, availability: 1, species: 1, shape: 1, createdAt: -1 });
ItemSchema.index({ caratSingle: 1 });
ItemSchema.index({ caratTotal: 1 });
ItemSchema.index({ pieceCount: 1 });

export const InventoryItem = (mongoose.models.InventoryItem as mongoose.Model<IInventoryItem>) || model<IInventoryItem>('InventoryItem', ItemSchema);
