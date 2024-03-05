import * as dotenv from 'dotenv'

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
  const newUrl = process.env.BASE_URL + '/oauth/token'
  const parameters = {
    client_id: process.env.GITLAB_APP_ID,
    client_secret: process.env.GITLAB_APP_SECRET,
    code: returnedCode,
    grant_type: 'authorization_code',
    redirect_uri: process.env.GITLAB_CALLBACK_URL
  }
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parameters)
  }

  const resp = await fetch(newUrl, options)
  const data = await resp.json()
  req.session.oauth = {
    access_token: data.access_token
  }
  res.redirect('/b3')
}

controller.authenticateLogout = async (req, res) => {
  req.logout()
  req.session.destroy()
  res.send('You are now logged out!')
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
    res.redirect('/b3/no-rep')
  }
}

// Repository config
controller.fetchProjects = async (req, res) => {
  console.log('# Fetching available repositories')

  const url = process.env.BASE_URL + '/api/v4/projects?membership=true'
  const headers = {
    Authorization: `Bearer ${res.data.oauth.access_token}`
  }
  const resp = await fetch(url, { headers })
  const projects = await resp.json()

  res.data.projects = projects
}

controller.noRep = async (req, res) => {
  await controller.fetchProjects(req, res)
  res.render('no_rep', res.data)
}

controller.repSave = async (req, res) => {
  req.session.config = {
    repository_id: req.body.repository_id
  }
  res.redirect('/b3')
}

// Gitlab
controller.home = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    controller.isConfigured(req, res, async () => {
      await controller.fetchProjects(req, res)
      res.render('home', res.data)
    })
  })
}

controller.issue = async (req, res) => {
  controller.isLoggedIn(req, res, async () => {
    controller.isConfigured(req, res, async () => {
      await controller.fetchProjects(req, res)
      const data = res.data
      const headers = {
        Authorization: `Bearer ${res.data.oauth.access_token}`
      }

      console.log('# Fetching repository issues')

      let url = process.env.BASE_URL + '/api/v4/projects/' + data.config.repository_id + '/issues?per_page=50'
      let resp = await fetch(url, { headers })
      const issues = await resp.json()

      data.issues = issues

      console.log('# Fetching issue notes')

      data.current_issue = req.params.id
      url = process.env.BASE_URL + '/api/v4/projects/' + data.config.repository_id + '/issues/' + data.current_issue + '/notes'
      resp = await fetch(url, { headers })
      const notes = await resp.json()
      data.notes = notes

      console.log('# Building website')
      res.render('issues', data)
    })
  })
}
