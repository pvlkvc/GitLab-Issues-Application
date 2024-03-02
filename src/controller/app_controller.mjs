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

}

// Authorization
controller.issue = async (req, res) => {
  // todo: make this retrievable from maybe local memory or smth? or session specific?
  const id = '36633'

  const data = res.data
  const headers = {
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
  }

  if (!data.issues) {
    console.log('# Fetching repository issues')

    const url = process.env.BASE_URL + 'projects/' + id + '/issues?per_page=50'
    const headers = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
    }
    const resp = await fetch(url, { headers })
    const issues = await resp.json()

    data.issues = issues
  }

  console.log('# Fetching issue notes')

  data.current_issue = req.params.id
  const url = 'https://gitlab.lnu.se/api/v4/projects/' + id + '/issues/' + data.current_issue + '/notes'
  const resp = await fetch(url, { headers })
  const notes = await resp.json()
  data.notes = notes

  console.log(data.issues[3].assignees)

  console.log('# Building website')
  res.render('issues', data)
}
