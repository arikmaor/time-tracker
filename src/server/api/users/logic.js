const bcrypt = require('bcrypt')
const randomString = require('random-string')
const {uniq, get, mapValues} = require('lodash')
const Model = require('./model')
const UserError = require('../../common/UserError')
const counters = require('../../common/counters')
const mailer = require('../../common/mailer')
const {getMultipleActivities} = require('../activities/logic')
const {getMultipleClients} = require('../clients/logic')

const SALT_ROUNDS = 12
const DUPLICATE_KEY_REG_EXP = /index: (?:.*\$)?([A-Za-z]*)_-?1/

async function populate(user) {
  const [clients, activities] = await Promise.all([
    getMultipleClients(uniq(user.activities.map(a => a.clientId))),
    getMultipleActivities(uniq(user.activities.map(a => a.activityId)))
  ])
  user.activities.forEach(a => {
    a.clientName = get(clients.find(({id}) => Number(id) === a.clientId), 'name')
    a.activityName = get(activities.find(({id}) => id === a.activityId), 'name')
  })
  return user
}

async function sendPasswordMail(user, password) {
  try {
    await mailer.sendMail({
      from: '"UINGAME" <contact@uingame.co.il>',
      to: user.email,
      subject: 'פרטי כניסה למערכת דיווחי שעות - שמיר יעוץ והדרכה',
      text: `
        שלום רב.
        זוהי הזמנה להשתמש במערכת דיווחי שעות של שמיר יעוץ והדרכה.
        לצורך כניסה למערכת, נוצרה עבורך סיסמא ראשונית.
        ביכולתך לשנות סיסמא זו כרצונך מתוך המערכת.
        https://uingame-timetracker.herokuapp.com

        שם משתמש:
        ${user.username}
        סיסמא:
        ${password}

        בכבוד רב,
        שמיר יעוץ והדרכה
      `
    })
  } catch (e) {
    console.error(`Error while sending mail to ${user.email}: ${e.message}`)
    console.debug(e)
  }
}

module.exports = {

  async getAllUsers() {
    const users = await Model.find().ne('isArchived', true).sort('firstName lastName').exec()
    return users
  },

  async getMultipleUsers(userIds) {
    const users = await Model.find().in('_id', userIds).sort('firstName lastName').exec()
    return users
  },

  async getUserById(id) {
    const user = await Model.findById(id).ne('isArchived', true).exec()
    if (!user) {
      throw new UserError('User not found')
    }
    return populate(user.toJSON())
  },

  async getUserByUsernameAndPassword(username, password) {
    const user = await Model.findOne()
      .ne('isArchived', true)
      .or([{username}, {email: username}])
      .exec()

    const isPasswordMatch = await bcrypt.compare(password, get(user, 'password', ''))
    return isPasswordMatch ? await populate(user.toJSON()) : undefined
  },

  async addUser(newUser) {
    const password = randomString()
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const _id = await counters.getNextId('users')
    try {
      const user = await Model.create({
        ...newUser,
        _id,
        password: passwordHash,
        isSystem: false
      })
      sendPasswordMail(user, password)
      return user
    } catch (err) {
      counters.cancelId('users', _id)
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      } else if (err.code === 11000) {
        const [_, key] = DUPLICATE_KEY_REG_EXP.exec(err.message)
        throw new UserError('User creation failed', {
          [key]: 'already exists'
        })
      }
      throw err
    }
  },

  async updateUser(id, updatedFields) {
    delete updatedFields.isSystem
    delete updatedFields.createdAt
    delete updatedFields.password
    updatedFields.modifiedAt = new Date()
    try {
      const user = await Model.findByIdAndUpdate(id, updatedFields, {
        new: true,
        runValidators: true
      }).ne('isArchived', true).exec()
      if (!user) {
        throw new UserError('User not found')
      }
      return user;
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      } else if (err.name === 'CastError') {
        // if (err.kind === 'embedded' && err.path === 'activities') {
        //   const errId = ACTIVITY_ID_REG_EXP.exec(err.value)[1]
        //   const idx = updatedFields.activities.findIndex(({activityId}) => activityId === errId)
        //   throw new UserError(`${err.reason.path} must be a '${err.reason.kind}'`, {[`${err.path}.${idx}.${err.reason.path}`]: `not a ${err.reason.kind}`})
        // }
        throw new UserError(`${err.path} must be a '${err.kind}'`, {[err.path]: `not a ${err.kind}`})
      } else if (err.code === 11000) {
        const [_, key] = DUPLICATE_KEY_REG_EXP.exec(err.message)
        throw new UserError('User update failed', {
          [key]: 'already exists'
        })
      }
      throw err
    }

  },

  async resetPassword(userId) {
    const password = randomString()
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await Model.findByIdAndUpdate(userId, {
      password: passwordHash
    }, {
      new: true
    }).ne('isArchived', true).exec()

    if (!user) {
      throw new UserError('User not found')
    }

    sendPasswordMail(user, password)

    return {success: true};
  },

  async changePassword(user, oldPassword, newPassword) {
    const rawUser = await Model.findById(user._id).ne('isArchived', true).exec()
    if (!rawUser) {
      throw new UserError('User not found')
    }
    const isPasswordMatch = await bcrypt.compare(oldPassword, get(rawUser, 'password', ''))
    if (!isPasswordMatch) {
      throw new UserError('Incorrect password', {
        oldPassword: 'Incorrect password'
      })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await Model.findByIdAndUpdate(user._id, {
      password: newPasswordHash
    }).ne('isArchived', true).exec()

    return {success: true}
  },

  async archiveUser(id) {
    const update = {
      isArchived: true,
      $rename: {
        username: '_username',
        idNumber: '_idNumber',
        email: '_email'
      }
    }
    const user = await Model.findByIdAndUpdate(id, update, {
      lean: true
    })
      .ne('isSystem', true)
      .ne('isArchived', true)
      .exec()
    return {result: !!user};
  }

}
