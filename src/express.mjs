import express from 'express'
import logger from 'morgan'
import appRoute from './route/app_route.mjs'

const app = express()
app.set('view engine', 'ejs')

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
