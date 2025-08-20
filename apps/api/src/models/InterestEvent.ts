import mongoose, { Schema, model, Types } from 'mongoose';

export interface IInterestEvent {
  _id: string;
  itemId: Types.ObjectId;
  ts: Date;
  referer?: string;
  userAgent?: string;
}

const InterestEventSchema = new Schema<IInterestEvent>({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', index: true, required: true },
  ts: { type: Date, default: () => new Date(), index: true },
  referer: String,
  userAgent: String
});

export const InterestEvent = (mongoose.models.InterestEvent as mongoose.Model<IInterestEvent>) || model<IInterestEvent>('InterestEvent', InterestEventSchema);
