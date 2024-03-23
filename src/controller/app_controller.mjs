import * as dotenv from 'dotenv'
import wsServer from '../websocket.mjs'
import { model } from '../model/user.mjs'
import { URL } from 'url'
import { closeIssue, commentIssue, createWebhook, getIssueNotes, getIssues, getRepositories, getUserInfo, getWebhooks, openIssue, requestToken, revokeToken } from '../api.mjs'

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

  // Setting up user's web socket token and webhook secret
  console.log('# Searching for user in database')
  const user = await model.findByUsername(info.username)
  let token = Math.random().toString(36)
  while ((await model.findBySocketToken(token)).length !== 0) {
    token = Math.random().toString(36)
  }
  if (user.length === 0) {
    const secret = Math.random().toString(36)
    model.add(info.username, secret, token)
  } else {
    model.updateSocketToken(info.username, token)
  }
  console.log('Session token: ', token)

  res.redirect('/b3')
}

controller.authenticateLogout = async (req, res) => {
  console.log('# Revoking user token')
  await revokeToken(res.data.oauth.access_token)
  req.session.oauth = {
    access_token: null
  }
  res.redirect('/b3')
}

// Status checks
controller.isLoggedIn = (req, res, next) => {
  console.log('# Checking for access token presence')
  if (res.data.oauth.access_token) {
    console.log('# Token present')
    next()
  } else {
    console.log('# Missing token')
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
  controller.isLoggedIn(req, res, async () => {
    console.log('# Fetching available repositories')
    res.data.projects = await getRepositories(res.data.oauth.access_token)
    res.render('config', res.data)
  })
}

controller.repSave = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    // Save current repository into session
    const repID = req.body.repository_id
    req.session.config = {
      repository_id: repID,
      username: res.data.config.username
    }

    // Retrieve this project's webhooks and see if application already has a webhook
    const hooks = await getWebhooks(repID, res.data.oauth.access_token)

    if (hooks) {
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
        const user = (await model.findByUsername(res.data.config.username))[0]
        createWebhook(repID, res.data.config.username, user.webhookSecret, res.data.oauth.access_token)
        console.log('# Created a new webhook for user')
      } else {
        console.log('# User webhook already exists.')
      }
    }

    res.redirect('/b3')
  })
}

// Webhooks
controller.webhookReceive = async (req, res) => {
  console.log('# Webhook POST')

  const id = req.params.id
  const user = (await model.findByUsername(id))[0]

  // Confirm webhook's source todo
  const userSecret = user.webhookSecret
  const receivedToken = req.get('x-gitlab-token')
  if (userSecret === receivedToken) {
    res.sendStatus(200)
    // Forward webhook to user via websocket
    const token = user.socketToken
    const data = {
      iid: req.body.object_attributes.iid,
      title: req.body.object_attributes.title,
      repository_id: req.body.project.id
    }
    wsServer.emit('webhook', token, data)
  } else {
    res.sendStatus(401)
    console.warn('# Received fake webhook for user ', id)
  }
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

      // Include web socket token for the user to connect to
      const user = await model.findByUsername(res.data.config.username)
      res.data.wsToken = user[0].socketToken

      console.log('# Building website')
      res.render('issues', res.data)
    })
  })
}

controller.issue = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    controller.isConfigured(req, res, async () => {
      res.data.current_issue = req.params.id

      const repository = res.data.config.repository_id
      const token = res.data.oauth.access_token

      console.log('# Fetching repository issues')
      res.data.issues = await getIssues(repository, token)

      console.log('# Fetching issue notes')
      res.data.notes = await getIssueNotes(repository, res.data.current_issue, token)

      // Include web socket token for the user to connect to
      const user = await model.findByUsername(res.data.config.username)
      res.data.wsToken = user[0].socketToken

      console.log('# Building website')
      res.render('issues', res.data)
    })
  })
}

controller.issueClose = async (req, res) => {
  console.log('# Closing an issue')
  const id = req.params.id
  await closeIssue(res.data.config.repository_id, id, res.data.oauth.access_token)
  res.redirect('/b3/issue/' + id)
}

controller.issueOpen = async (req, res) => {
  const id = req.params.id
  console.log('# Opening an issue')
  await openIssue(res.data.config.repository_id, id, res.data.oauth.access_token)
  res.redirect('/b3/issue/' + id)
}

controller.issueComment = async (req, res) => {
  console.log('# Posting a comment on an issue')
  const id = req.params.id
  const comment = req.body.comment
  await commentIssue(res.data.config.repository_id, id, comment, res.data.oauth.access_token)
  res.redirect('/b3/issue/' + id)
}

// Makeshift admin method for purging database
controller.deleteAll = async (req, res) => {
  if (res.data.config.username === 'ap223uu') {
    await model.deleteAll()
  }
  res.redirect('/b3')
}
