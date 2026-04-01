import mongoose from 'mongoose'

const accessLogSchema = new mongoose.Schema(
  {
    accessedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    actorEmail: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    forwardedFor: {
      type: String,
      default: '',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      default: '',
      trim: true,
    },
    sourceLabel: {
      type: String,
      default: 'Unknown source',
      trim: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    userRole: {
      type: String,
      default: 'anonymous',
      trim: true,
    },
  },
  {
    collection: 'access_logs',
    timestamps: false,
  },
)

export const AccessLogModel =
  mongoose.models.AccessLog || mongoose.model('AccessLog', accessLogSchema)
