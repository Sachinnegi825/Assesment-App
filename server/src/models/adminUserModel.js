import mongoose from 'mongoose'

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['admin'],
    },
  },
  {
    collection: 'admin_users',
    timestamps: true,
  },
)

export const AdminUserModel =
  mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema)
