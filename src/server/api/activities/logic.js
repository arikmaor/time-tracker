const {mapValues} = require('lodash')
const Model = require('./model')
const ClientsModel = require('../clients/model')
const UsersModel = require('../users/model')
const UserError = require('../../common/UserError')

const DUPLICATE_KEY_REG_EXP = /index: (?:.*\$)?([A-Za-z]*)_-?1/

module.exports = {

  async getAllActivities(user) {
    let query = Model.find().ne('isArchived', true).sort('name')

    if (!user.isAdmin) {
      query = query.in('_id', user.activities.map(a => a.activityId))
    }

    const activities = await query.exec()
    return activities
  },

  async getActivityById(id) {
    const activity = await Model.findById(id).ne('isArchived', true).exec()
    if (!activity) {
      throw new UserError('Activity not found')
    }
    return activity
  },

  async getMultipleActivities(ids) {
    const activities = await Model.find()
      .in('_id', ids)
      .sort('name')
      .exec()
    return activities
  },

  async addActivity(newActivity) {
    try {
      const activity = await Model.create(newActivity)
      return activity
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      } else if (err.code === 11000) {
        const [_, key] = DUPLICATE_KEY_REG_EXP.exec(err.message)
        throw new UserError('Activity creation failed', {
          [key]: 'already exists'
        })
      }
      throw err
    }
  },

  async updateActivity(id, updatedFields) {
    delete updatedFields.createdAt
    updatedFields.modifiedAt = new Date()
    try {
      const activity = await Model.findByIdAndUpdate(id, updatedFields, {
        new: true,
        runValidators: true
      }).ne('isArchived', true).exec()
      if (!activity) {
        throw new UserError('Activity not found')
      }
      return activity;
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      } else if (err.name === 'CastError') {
        throw new UserError(`${err.path} must be a '${err.kind}'`, {[err.path]: `not a ${err.kind}`})
      } else if (err.code === 11000) {
        const [_, key] = DUPLICATE_KEY_REG_EXP.exec(err.message)
        throw new UserError('Activity update failed', {
          [key]: 'already exists'
        })
      }
      throw err
    }

  },

  async archiveActivity(id) {
    const clientsCount = await ClientsModel.count({'activities.activityId': id}).exec()
    if (clientsCount > 0) {
      throw new UserError('There are clients registerd to this activity!')
    }

    const update = {
      isArchived: true,
      $rename: {
        name: '_name'
      }
    }
    const activity = await Model.findByIdAndUpdate(id, update, {
      lean: true
    })
      .ne('isArchived', true)
      .exec()

    UsersModel.updateMany({
      'activities.activityId': id
    }, {
      $pull: {activities: {activityId: id}}
    }).exec()

    return {result: !!activity};
  }

}
