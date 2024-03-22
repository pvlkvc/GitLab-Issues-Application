import * as dotenv from 'dotenv'
import mongoose from 'mongoose'

export const model = {}

// Connect to database
dotenv.config()
mongoose.Promise = global.Promise
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 3000
})

// Create a database schema
const Schema = mongoose.Schema
const userSchema = new Schema({
  username: String,
  bcryptPassword: String,
  accessToken: String,
  refreshToken: String,
  socketToken: String
})

// Compile a model from the schema
const User = mongoose.model('User', userSchema)

/**
 * Adds a new user.
 * @param {Array} data of the new user
 * @returns {boolean} true if user added, false if username already exists
 */
model.add = async (data) => {
  const user = new User({
    username: data.username,
    bcryptPassword: data.bcryptPassword,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    socketToken: data.socketToken
  })

  await user.save()
  return true
}

model.updateAccessTokens = async (data) => {
  await User.updateOne({ username: data.username }, { accessToken: data.accessToken, refreshToken: data.refreshToken })
}

model.updateSocketToken = async (data) => {
  await User.updateOne({ username: data.username }, { socketToken: data.socketToken })
}

model.findByUsername = async (name) => {
  return await User.find({
    username: name
  })
}

model.findBySocketToken = async (token) => {
  return await User.find({
    socketToken: token
  })
}
