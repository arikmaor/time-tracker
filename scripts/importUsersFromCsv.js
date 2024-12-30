const {configureMongoose} = require('../src/server/mongoose')
const {addUser} = require('../src/server/api/users/logic')
const csv = require('csvtojson')

const FILENAME = 'data.csv'

run()
async function run() {
  try {
    await configureMongoose()
    const users = await csv().fromFile(FILENAME)
    users.forEach(_addUser)
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

async function _addUser(user = {}) {
  console.log(`adding user ${user.firstName} ${user.lastName}`)
  console.log(user)
  try {
    await addUser(user)
    console.log('success!')
  }
  catch (err) {
    console.error(`Error adding ${user.firstName} ${user.lastName}`)
    console.error(err.message)
    if (err.fields) {
      Object.keys(err.fields).forEach(field => {
        console.error(`${field}: ${err.fields[field]}`)
      })
    }

  }
}
