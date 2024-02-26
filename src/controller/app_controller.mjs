export const controller = {}

// Error codes
controller.errorForbidden = (req, res) => {
  // res.render('403', res.data)
  res.send(403)
}

controller.errorNotFound = (req, res) => {
  // res.render('404', res.data)
  res.send(404)
}

// Authorization
controller.issues = (req, res) => {
  res.render('issues', res.data)
}
