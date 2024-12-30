const {configureMongoose} = require('../src/server/mongoose')
const {getAllUsers, resetPassword} = require('../src/server/api/users/logic')

const EXCLUDE_EMAILS = [
  'uingame@uingame.co.il',
  'arikmaor@gmail.com',
  'shamir.gilad@gmail.com',
  'sharondovner@gmail.com'
]

run()
async function run() {
  try {
    await configureMongoose()

    const users = await getAllUsers()
    await Promise.all(users
      .filter(({email}) => !EXCLUDE_EMAILS.includes(email))
      .map(({_id, email}) => {
        console.log(`Sending reset password email to ${email}.`)
        return resetPassword(_id)
      })
    )
    console.log('done')
  } catch (err) {
    console.error(err)
  }
}


