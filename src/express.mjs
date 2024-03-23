import express from 'express'
import session from 'cookie-session'
import logger from 'morgan'
import appRoute from './route/app_route.mjs'
import wsServer from './websocket.mjs'

const app = express()
app.set('view engine', 'ejs')

// Enable the session
app.use(session({
  cookie: {
    maxAge: 6000000
  },
  resave: false,
  saveUninitialized: true,
  secret: 'mitch'
}))

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
    repository_id: null,
    username: null
  }
  if (req.session && req.session.oauth) {
    res.data.oauth.access_token = req.session.oauth.access_token ?? null
  }
  if (req.session && req.session.config) {
    res.data.config.repository_id = req.session.config.repository_id ?? null
  }
  if (req.session && req.session.config) {
    res.data.config.username = req.session.config.username ?? null
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
  const server = app.listen(port, () => {
    console.log(`Listening at port ${port}`)
  })

  // Enable upgrade requests on http to ws
  server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
      wsServer.emit('connection', socket, request)
    })
  })
}
