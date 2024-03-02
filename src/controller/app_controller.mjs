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

      const url = 'https://' + data.config.base_url + '/api/v4/projects/' + data.config.repository_id + '/issues?per_page=50'
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
