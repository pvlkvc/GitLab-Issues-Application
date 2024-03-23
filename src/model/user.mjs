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
  gitlabUsername: String,
  webhookSecret: String,
  socketToken: String
})

// Compile a model from the schema
const User = mongoose.model('User', userSchema)

/**
 * Adds a new user.
 * @param {string} username of the user
 * @param {string} secret for user's webhooks
 * @param {string} token for user's web socket
 * @returns {boolean} true if user added, false if username already exists
 */
model.add = async (username, secret, token) => {
  const user = new User({
    gitlabUsername: username,
    webhookSecret: secret,
    socketToken: token
  })

  await user.save()
  return true
}

model.updateSocketToken = async (username, token) => {
  await User.updateOne({ gitlabUsername: username }, { socketToken: token })
}

model.findByUsername = async (username) => {
  return await User.find({
    gitlabUsername: username
  })
}

model.findBySocketToken = async (token) => {
  return await User.find({
    socketToken: token
  })
}

model.deleteAll = async () => {
  await User.deleteMany()
}
