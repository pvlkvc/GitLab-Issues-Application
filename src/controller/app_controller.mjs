import * as dotenv from 'dotenv'
import wsServer from '../websocket.mjs'
import { URL } from 'url'
import { createWebhook, getIssueNotes, getIssues, getRepositories, getUserInfo, getWebhooks, requestToken } from '../api.mjs'

export const controller = {}

dotenv.config()

// Error codes
controller.errorForbidden = (req, res) => {
  // res.render('403', res.data)
  res.send(403)
}

controller.errorNotFound = (req, res) => {
  // res.render('404', res.data)
  res.send(404)
}

// OAuth Authentication
controller.unauthenticatedPage = async (req, res) => {
  res.render('unauthenticated', res.data)
}

controller.authenticateRequest = async (req, res) => {
  console.log('# Authentication request')
  res.status(301).redirect(process.env.BASE_URL + `/oauth/authorize?client_id=${process.env.GITLAB_APP_ID}&redirect_uri=${process.env.GITLAB_CALLBACK_URL}&response_type=code&state=${process.env.GITLAB_STATE}&scope=api`)
}

controller.authenticateCallback = async (req, res) => {
  console.log('# Received callback')

  // Retrieving code from the URL
  const url = new URL(process.env.BASE_URL + res.req.url)
  const params = new URLSearchParams(url.search)
  const returnedCode = params.get('code')

  // Requesting the access token
  const data = await requestToken(returnedCode)
  req.session.oauth = {
    access_token: data.access_token
  }

  // Retrieving current username
  const info = await getUserInfo(data.access_token)
  req.session.config = {
    username: info.username
  }
  console.log(info)

  res.redirect('/b3')
}

controller.authenticateLogout = async (req, res) => {
  console.log('### Figure out how to log that out lol')
}

// Status checks
controller.isLoggedIn = (req, res, next) => {
  console.log('# Checking for access token presence')
  console.log('token: ', res.data.oauth.access_token)
  if (res.data.oauth.access_token) {
    console.log('Token present')
    next()
  } else {
    console.log('Missing token')
    res.status(403)
    res.redirect('/b3/auth')
  }
}

controller.isConfigured = (req, res, next) => {
  console.log('# Checking for repository id presence')
  if (res.data.config.repository_id) {
    next()
  } else {
    res.status(403)
    res.redirect('/b3/config')
  }
}

// Repository config
controller.repConfig = async (req, res) => {
  console.log('# Fetching available repositories')
  res.data.projects = await getRepositories(res.data.oauth.access_token)
  res.render('config', res.data)
}

controller.repSave = async (req, res) => {
  // Save current repository into session
  const repID = req.body.repository_id
  req.session.config = {
    repository_id: repID
  }

  // Retrieve this project's webhooks and see if application already has a webhook
  const hooks = await getWebhooks(repID, res.data.oauth.access_token)

  // todo: possibly replace with hooks.array.forEach, but make sure other things work first...
  let found = false
  for (const i in hooks) {
    const parsed = new URL(hooks[i].url)
    if (parsed.pathname === '/b3/webhook/' + res.data.config.username) {
      found = true
      break
    }
  }

  // Create new webhook if it wasn't found
  if (!found) {
    createWebhook(repID, res.data.config.username, res.data.oauth.access_token)
    console.log('# Created a new webhook for user')
  } else {
    console.log('# User webhook already exists.')
  }

  res.redirect('/b3')
}

// Webhook
controller.webhookReceive = async (req, res) => {
  console.log('# Webhook POST')
  console.log(req.body)

  const id = req.params.id
  console.log(id)

  // send out message on web socket for this ID
  // how? open a client socket here?? or somehow get a link to server object ??
  // wsServer.sendToClient(id, data)
  console.log('# [ TEST ] Should be sending webhook data out to client now via websocket')
}

controller.userInfo = async (req, res) => {
  const info = await getUserInfo(res.data.oauth.access_token)
  console.log('User info: ', info)
}

// Gitlab
controller.home = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    controller.isConfigured(req, res, async () => {
      res.render('home', res.data)
    })
  })
}

controller.issueBlank = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    controller.isConfigured(req, res, async () => {
      res.data.current_issue = null

      const repository = res.data.config.repository_id
      const token = res.data.oauth.access_token

      console.log('# Fetching repository issues')
      res.data.issues = await getIssues(repository, token)

      // todo: include websocket connect in view
      console.log('# Building website')
      res.render('issues', res.data)
    })
  })
}

controller.issue = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    controller.isConfigured(req, res, async () => {
      // todo: check if webhook exists ?? create it if it doesn't
      res.data.current_issue = req.params.id

      const repository = res.data.config.repository_id
      const token = res.data.oauth.access_token

      console.log('# Fetching repository issues')
      res.data.issues = await getIssues(repository, token)

      console.log('# Fetching issue notes')
      res.data.notes = await getIssueNotes(repository, res.data.current_issue, token)

      // todo: include websocket connect in view
      console.log('# Building website')
      res.render('issues', res.data)
    })
  })
}
