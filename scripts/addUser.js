const {configureMongoose} = require('../src/server/mongoose')
const {addUser} = require('../src/server/api/users/logic')


run()
async function run() {
  try {
    await configureMongoose()
    await addUser({
      username: 'admin',
      password: '1234',
      isAdmin: true,
      firstName: 'מנהל',
      lastName: 'uingame',
      idNumber: 123456789,
      type: 'employee',
      address: 'יבנה',
      phone: '12345678',
      email: 'uingame@uingame.co.il',
      startDate: new Date()
    })
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


