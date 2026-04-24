import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    registrationCap: {
      type: Number,
      default: 100,
      min: 0,
    },
    qualifyingThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
  },
  {
    collection: 'settings',
    timestamps: true,
  },
)

export const SettingsModel =
  mongoose.models.Settings || mongoose.model('Settings', settingsSchema)
