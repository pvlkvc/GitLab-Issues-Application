import express from 'express'
import session from 'express-session'
import logger from 'morgan'
import passport from 'passport'
import gitlabStrategy from 'passport-gitlab2'
import appRoute from './route/app_route.mjs'

const app = express()
app.set('view engine', 'ejs')

// Prepare authorization
passport.use(new gitlabStrategy.Strategy(
  {
    clientID: process.env.GITLAB_APP_ID,
    clientSecret: process.env.GITLAB_APP_SECRET,
    callbackURL: 'https://cscloud7-207.lnu.se/b3/auth/callback',
    baseURL: process.env.BASE_URL
  },
  function (accessToken, refreshToken, profile, cb) {
    return cb(null, profile)
  }
))
passport.serializeUser(function (user, cb) {
  cb(null, user)
})
passport.deserializeUser(function (user, cb) {
  cb(null, user)
})

// Enable the session
app.use(session({
  cookie: {
    maxAge: 6000000
  },
  resave: false,
  saveUninitialized: true,
  secret: 'mitch'
}))
app.use(passport.initialize())
app.use(passport.session())

// Enable use of flash messages and prepare the data object
app.use((req, res, next) => {
  res.data = {}
  res.data.flashMessage = null
  if (req.session && req.session.flashMessage) {
    res.data.flashMessage = req.session.flashMessage
    req.session.flashMessage = null
  }
  next()
})

// Preparing session specific data objects
app.use((req, res, next) => {
  res.data.oauth = {
    access_token: null
  }
  res.data.config = {
    base_url: null,
    repository_id: null
  }
  if (req.session && req.session.oauth) {
    res.data.oauth.access_token = req.session.oauth.access_token ?? null
  }
  if (req.session && req.session.config) {
    res.data.config.base_url = req.session.config.base_url ?? null
  }
  if (req.session && req.session.config) {
    res.data.config.repository_id = req.session.config.repository_id ?? null
  }
  next()
})

app.use(logger('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.send('Nothing specific here, head to /b3!\n')
})

app.use('/b3', appRoute)

export default (port = 5050) => {
  app.listen(port, () => {
    console.log(`Listening at port ${port}`)
  })
}
