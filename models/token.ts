import { models, model, Schema, Model, Document } from 'mongoose'

export const TokenSchema = new Schema(
  {
    userUri: { type: String, index: true },
        provider: { type: String, required: true, index: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },

    data: Object,
  },
  { timestamps: true }
)
interface TokenDoc extends Document {
  userUri: string
  provider: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  data: any
}
//@ts-ignore
const TokenModel = (models.Token as Model<TokenDoc> | undefined) || model<TokenDoc>('Token', TokenSchema)

export default TokenModel
