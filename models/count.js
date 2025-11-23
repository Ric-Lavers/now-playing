import { model, models, Schema } from 'mongoose'

export const CountSchema = new Schema(
  {
    count: Number,
    id: { type: String, unique: true },
    name: String,
  },
  { timestamps: true }
)

CountSchema.index({ id: 1 })

export default models.Count || model('Count', CountSchema)
