const {mapValues} = require('lodash')
const Model = require('./model')
const UsersModel = require('../users/model')
const {getMultipleActivities, getAllActivities} = require('../activities/logic')
const UserError = require('../../common/UserError')
const counters = require('../../common/counters')

const DUPLICATE_KEY_REG_EXP = /index: (?:.*\$)?([A-Za-z]*)_-?1/
const ACTIVITY_ID_REG_EXP = /activityId: '(\w*)'/

function populateActivites(client, activities) {
  client.activities.forEach(a => {
    const activity = activities.find(({id}) => id === a.activityId)
    if (activity) {
      a.name = activity.name
    }
  })
  return client
}

module.exports = {

  async getAllClients(user) {
    let query = Model.find().ne('isArchived', true).sort('name')

    if (!user.isAdmin) {
      query = query.in('_id', user.activities.map(a => a.clientId))
    }

    const [clients, activities] = await Promise.all([
      query.exec(),
      getAllActivities(user)
    ])

    return clients.map(client => populateActivites(client.toJSON(), activities))
  },

  async getMultipleClients(clientIds) {
    const clients = await Model.find().in('_id', clientIds).sort('name').exec()
    return clients
  },

  async getClientById(id) {
    const client = await Model.findById(id).ne('isArchived', true).exec()
    if (!client) {
      throw new UserError('Client not found')
    }
    const activityIds = (client.activities || []).map(a => a.activityId)
    const plainClient = client.toJSON()
    if (activityIds.length > 0) {
      const activities = await getMultipleActivities(activityIds)
      populateActivites(plainClient, activities)
    }
    return plainClient
  },

  async addClient(newClient) {
    const _id = await counters.getNextId('clients')
    try {
      const client = await Model.create({
        ...newClient,
        _id
      })
      return client
    } catch (err) {
      counters.cancelId('clients', _id)
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      } else if (err.code === 11000) {
        const [_, key] = DUPLICATE_KEY_REG_EXP.exec(err.message)
        throw new UserError('Client creation failed', {
          [key]: 'already exists'
        })
      }
      throw err
    }
  },

  async updateClient(id, updatedFields) {
    delete updatedFields.createdAt
    updatedFields.modifiedAt = new Date()
    try {
      const client = await Model.findByIdAndUpdate(id, updatedFields, {
        new: true,
        runValidators: true
      }).ne('isArchived', true).exec()
      if (!client) {
        throw new UserError('Client not found')
      }
      return client;
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      } else if (err.name === 'CastError') {
        if (err.kind === 'embedded' && err.path === 'activities') {
          const errId = ACTIVITY_ID_REG_EXP.exec(err.value)[1]
          const idx = updatedFields.activities.findIndex(({activityId}) => activityId === errId)
          throw new UserError(`${err.reason.path} must be a '${err.reason.kind}'`, {[`${err.path}.${idx}.${err.reason.path}`]: `not a ${err.reason.kind}`})
        }
        throw new UserError(`${err.path} must be a '${err.kind}'`, {[err.path]: `not a ${err.kind}`})
      } else if (err.code === 11000) {
        const key = DUPLICATE_KEY_REG_EXP.exec(err.message)[1]
        throw new UserError('Client update failed', {
          [key]: 'already exists'
        })
      }
      throw err
    }

  },

  async archiveClient(id) {
    const update = {
      isArchived: true,
      $rename: {
        name: '_name'
      }
    }
    const client = await Model.findByIdAndUpdate(id, update, {
      lean: true
    })
      .ne('isArchived', true)
      .exec()

    UsersModel.updateMany({
      'activities.clientId': id
    }, {
      $pull: {activities: {clientId: id}}
    }).exec()

    return {success: !!client};
  }

}
