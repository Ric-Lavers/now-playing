import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const TokenSchema = new Schema(
  {
    userUri: { type: String, index: true },
    provider: { type: String, required: true, index: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    data: Object
  },
  { timestamps: true }
);

const TokenModel = models.Token || model('Token', TokenSchema);

export default TokenModel;

