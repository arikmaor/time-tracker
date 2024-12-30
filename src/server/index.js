require('dotenv').config()
const fs = require('fs')
const path = require('path')
const express = require('express')
const fallback = require('express-history-api-fallback')
const bodyParser = require('body-parser')
const config = require('./config')
const UserError = require('./common/UserError')
const {configureMongoose} = require('./mongoose')

const API_DIR = path.join(__dirname, 'api')

const PUBLIC_FOLDER = 'dist'

configureMongoose()

const app = express()

if (config.debug) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} [${req.connection.remoteAddress}] - ${req.method} ${req.protocol}://${req.hostname}${req.path}`)
    next()
  })
}

app.use('/api', createApiRouter())

app.use(express.static(PUBLIC_FOLDER))
app.use(fallback('index.html', { root: PUBLIC_FOLDER }))

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}...`)
})

function createApiRouter() {
  const router = new express.Router()

  router.use(bodyParser.json())

  fs.readdirSync(API_DIR).filter(dir => dir !== 'common').forEach(api => {
    const routerPath = path.join(API_DIR, api, 'router.js')
    if (fs.existsSync(routerPath)) {
      router.use(`/${api}`, require(routerPath))
    }
  })

  router.use('*', (req, res, next) => {
    res.status(404).json({error: 'Endpoint doesn\'t exist'})
  })

  //general error handler
  router.use((err, req, res, next) => {
    if (err instanceof UserError) {
      console.debug(err)
      const ret = {
        error: err.message
      }
      if (err.fields) {
        ret.fields = err.fields
      }
      res.status(400).json(ret)
    } else {
      console.error(err)
      res.status(500).json({error: 'Internal Server Error'})
    }
  })

  return router
}
