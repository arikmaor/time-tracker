const {mapValues, uniq, get} = require('lodash')
const moment = require('moment')
const Model = require('../reports/model')
const clientsLogic = require('../clients/logic')
const activitiesLogic = require('../activities/logic')
const UserError = require('../../common/UserError')

async function populate(reports) {
  const [clients, activities] = await Promise.all([
    clientsLogic.getMultipleClients(uniq(reports.map(r => r.clientId))),
    activitiesLogic.getMultipleActivities(uniq(reports.map(r => r.activityId)))
  ])
  reports.forEach(report => {
    const client = clients.find(({id}) => Number(id) === report.clientId)
    const activity = activities.find(({id}) => id === report.activityId)
    report.activityName = get(activity, 'name')
    report.clientName = get(client, 'name')
  })
}

module.exports = {

  async getMonthTimeTracking(user, month, year, userId) {
    if (!month) {
      throw new UserError('Month is required!', {month: 'required!'})
    }
    if (month > 12 || month < 1) {
      throw new UserError('Month must be between 1 and 12!', {month: 'must be between 1 and 12!'})
    }
    if (!year) {
      throw new UserError('Year is required!', {year: 'required!'})
    }
    firstTimestamp = new Date(Date.UTC(year, month-1, 1, 0, 0, 0)).toUTCString()
    lastTimestamp = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toUTCString()
    const reportModels = await Model.find({
      userId: (user.isAdmin && userId) ? userId : user._id,
      date: {
        $gte: firstTimestamp,
        $lt: lastTimestamp
      }
    })
      .sort('date startTime')
      .exec()

    const reports = reportModels.map(r => r.toJSON())

    await populate(reports)


    return reports
  },

  async addTimeTrackingReport(user, reportData) {
    validateReportDate(user, reportData.date)
    const newReport = reportData
    if (!user.isAdmin || !reportData.userId) {
      newReport.userId = user._id
    }
    try {
      const reportModel = await Model.create(newReport)
      const report = reportModel.toJSON()

      await populate([report])

      return report
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      }
      throw err
    }
  },

  async updateTimeTrackingReport(user, reportId, updatedFields) {
    validateReportDate(user, updatedFields.date)
    delete updatedFields.createdAt
    updatedFields.modifiedAt = new Date()
    let userId = user._id
    if (user.isAdmin && updatedFields.userId) {
      userId = updatedFields.userId
    } else {
      delete updatedFields.userId
    }
    try {
      const reportModel = await Model.findOneAndUpdate({
        _id: reportId,
        userId
      },
      updatedFields, {
        new: true,
        runValidators: true
      }).exec()
      if (!reportModel) {
        throw new UserError('Report not found')
      }
      const report = reportModel.toJSON()
      await populate([report])
      return report;
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw new UserError(err._message, mapValues(err.errors, e => e.message))
      }
      throw err
    }
  },

  async deleteTimeTrackingReport(user, reportId) {
    const deleteReq = {
      _id: reportId
    }
    if (!user.isAdmin) {
      deleteReq.userId = user._id
    }
    const {acknowledged, deletedCount} = await Model.deleteOne(deleteReq)
    console.log('deleteReq', deleteReq, 'ok', acknowledged, 'n', deletedCount)
    if (acknowledged && deletedCount > 0) {
      return {success: true}
    } else {
      throw new UserError('Report not found')
    }
  }
}

function validateReportDate(user, reportDate) {
  if (user.isAdmin || !reportDate) {
    return
  }

  let firstAllowedDate = moment.utc({day: 1})
  if (moment.utc().date() <= user.lastReportDay) {
    firstAllowedDate = firstAllowedDate.add(-1, 'months')
  }

  if (moment.utc(reportDate).isBefore(firstAllowedDate)) {
    throw new UserError(`Not allowed to update time tracking before ${firstAllowedDate}`)
  }
}
