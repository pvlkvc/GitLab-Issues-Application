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

// Authentication
controller.isLoggedIn = async (req, res, next) => {
  req.user ? next() : res.sendStatus(401)
}

controller.authenticateRequest = async (req, res) => {
  console.log('# Authentication request')
  res.status(301).redirect(process.env.BASE_URL + `/oauth/authorize?client_id=${process.env.GITLAB_APP_ID}&redirect_uri=${process.env.GITLAB_CALLBACK_URL}&response_type=code&state=${process.env.GITLAB_STATE}&scope=api`)
}

controller.authenticateCode = async (req, res) => {
  console.log('# Received callback')

  // Retrieving code from the URL
  const url = res.req.url
  const params = url.split('?')
  const asJson = JSON.parse('{"' + decodeURI(params[1]).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
  const code = asJson.code

  const newUrl = process.env.BASE_URL + `/oauth/token?client_id=${process.env.GITLAB_APP_ID}&client_secret=${process.env.GITLAB_APP_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${process.env.GITLAB_TOKEN_URL}`
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }
  const resp = await fetch(newUrl, options)
  console.log(resp)
}

controller.receiveToken = async (req, res) => {
  console.log('# Received a token!')
  console.log(res)
}

controller.authenticateFailure = async (req, res) => {
  res.send('Something went wrong. Please try again')
}

controller.authenticateSuccess = async (req, res) => {
  console.log('success')
}

controller.authenticateLogout = async (req, res) => {
  req.logout()
  req.session.destroy()
  res.send('You are now logged out!')
}

// Gitlab
controller.home = async (req, res) => {
  res.redirect('/b3/issue/1')
}

controller.isConfigured = (req, res, next) => {
  console.log('# Checking for config presence')
  console.log('url: ', res.data.config.base_url)
  console.log('id: ', res.data.config.repository_id)
  if (res.data.config.base_url && res.data.config.repository_id) {
    next()
  } else {
    res.status(303)
    res.redirect('/b3/config')
  }
}

controller.configForm = (req, res) => {
  res.render('config', res.data)
}

controller.configSubmit = async (req, res) => {
  req.session.config = {
    base_url: req.body.base_url,
    repository_id: req.body.repository_id
  }
  res.redirect('/b3')
}

// Authorization
controller.issue = async (req, res) => {
  // todo: make this retrievable from maybe local memory or smth? or session specific?
  controller.isConfigured(req, res, async () => {
    const data = res.data
    const headers = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
    }

    if (!data.issues) {
      console.log('# Fetching repository issues')

      const url = data.config.base_url + '/api/v4/projects/' + data.config.repository_id + '/issues?per_page=50'
      const headers = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
      }
      const resp = await fetch(url, { headers })
      const issues = await resp.json()

      data.issues = issues
    }

    console.log('# Fetching issue notes')

    data.current_issue = req.params.id
    const url = 'https://' + data.config.base_url + '/api/v4/projects/' + data.config.repository_id + '/issues/' + data.current_issue + '/notes'
    const resp = await fetch(url, { headers })
    const notes = await resp.json()
    data.notes = notes

    console.log('# Building website')
    res.render('issues', data)
  })
}
