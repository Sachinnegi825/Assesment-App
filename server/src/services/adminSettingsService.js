import mongoose from 'mongoose'
import { SettingsModel } from '../models/settingsModel.js'

const DEFAULT_SETTINGS = {
  registrationCap: 100,
  qualifyingThreshold: 60,
}

export async function ensureSeedSettings() {
  if (mongoose.connection.readyState !== 1) {
    return false
  }

  const existingSettings = await SettingsModel.findOne().lean()

  if (existingSettings) {
    return true
  }

  await SettingsModel.create(DEFAULT_SETTINGS)

  console.info('[server] global settings seeded')
  return true
}

export async function getGlobalSettings() {
  if (mongoose.connection.readyState !== 1) {
    return DEFAULT_SETTINGS
  }

  const settings = await SettingsModel.findOne().lean()
  return settings || DEFAULT_SETTINGS
}

export async function updateGlobalSettings(updates) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('database_unavailable')
  }

  const settings = await SettingsModel.findOneAndUpdate(
    {},
    {
      $set: {
        registrationCap: updates.registrationCap,
        qualifyingThreshold: updates.qualifyingThreshold,
      },
    },
    {
      new: true,
      upsert: true,
    },
  ).lean()

  return settings
}
