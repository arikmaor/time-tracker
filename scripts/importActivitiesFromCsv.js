const {pickBy, uniqBy} = require('lodash')
const {configureMongoose} = require('../src/server/mongoose')
const {getAllActivities} = require('../src/server/api/activities/logic')
const {getAllClients, updateClient} = require('../src/server/api/clients/logic')
const csv = require('csvtojson')

const FILENAME = 'data.csv'

run()
async function run() {
  try {
    await configureMongoose()
    const lines = await csv().fromFile(FILENAME)
    const activities = await getAllActivities({isAdmin: true})
    for (line of uniqBy(lines, x => x.clientName)) {
      await setupActivities(line, activities, await getAllClients({isAdmin: true}))
    }
    console.log('success!')
  } catch (err) {
    console.error(err)
    if (err.fields) {
      Object.keys(err.fields).forEach(field => {
        console.error(`${field}: ${err.fields[field]}`)
      })
    }
  }
}

async function setupActivities({clientName, ...rest}, allActivities, allClients) {
  const client = allClients.find(x => x.name === clientName)
  const activities = Object.keys(pickBy(rest)).map(name => allActivities.find(x => x.name === name)).filter(x => x)
  console.log(`${clientName} - ${activities.length} activities`)
  await updateClient(client._id, {activities: activities.map(({_id}) => ({activityId: _id}))})
}
