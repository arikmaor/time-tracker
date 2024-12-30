const {omit, uniq} = require('lodash')
const {configureMongoose} = require('../src/server/mongoose')
const {addActivity} = require('../src/server/api/activities/logic')
const {addClient} = require('../src/server/api/clients/logic')
const csv = require('csvtojson')

const FILENAME = 'data.csv'

run()
async function run() {
  try {
    await configureMongoose()
    const lines = await csv().fromFile(FILENAME)
    await Promise.all(uniq(lines.map(x => x.clientName)).map(_addClient))
    await _addActivities(uniq(Object.keys(omit(lines[0], 'clientName'))))
    console.log('success!')
  } catch (err) {
    console.error(err.message)
    if (err.fields) {
      Object.keys(err.fields).forEach(field => {
        console.error(`${field}: ${err.fields[field]}`)
      })
    }
  }
}

async function _addClient(clientName) {
  console.log(`Adding client ${clientName}`)
  await addClient({name: clientName})
}

async function _addActivities(activities) {
  await Promise.all(activities.map(name => addActivity({name})))
}
