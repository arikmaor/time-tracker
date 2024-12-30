const {uniq, map, groupBy, mapValues, sumBy, get, round} = require('lodash')
const Model = require('./model')
const usersLogic = require('../users/logic')
const clientsLogic = require('../clients/logic')
const activitiesLogic = require('../activities/logic')
const UserError = require('../../common/UserError')

async function getReports(startDate, endDate, group, filter) {
  if (!startDate) {
    throw new UserError('startDate is required!', {startDate: 'required!'})
  }
  if (!endDate) {
    throw new UserError('endDate is required!', {endDate: 'required!'})
  }

  let query = Model.find({
    date: {
      $gte: startDate,
      $lt: endDate
    }},
    null, {
      sort: {
        date: 1,
        startTime: 1,
        endTime: 1
      }
    })

  if (filter) {
    if (filter.users) {
      query = query.in('userId', filter.users)
    }
    if (filter.clients) {
      query = query.in('clientId', filter.clients)
    }
    if (filter.activities) {
      query = query.in('activityId', filter.activities)
    }
  }

  const reportModels = await query.exec()
  const reports = reportModels.map(r => r.toJSON())
  const [users, clients, activities] = await Promise.all([
    usersLogic.getMultipleUsers(uniq(reports.map(r => r.userId))),
    clientsLogic.getMultipleClients(uniq(reports.map(r => r.clientId))),
    activitiesLogic.getMultipleActivities(uniq(reports.map(r => r.activityId)))
  ])

  populate(reports, users, clients, activities)

  if (group === 'client') {
    const reportsByClient = groupBy(reports, r => r.clientId)
    return mapValues(reportsByClient, (reports) => {
      const reportsByWorkdays = map(groupBy(reports, r => r.date))
      
      return {
        reports,
        totalHours: sumBy(reports, r => r.duration),
        numberOfWorkdays: reportsByWorkdays.length,
      }
    })
  } else if (group === 'user') {
    const reportsByUser = groupBy(reports, r => r.userId)
    return mapValues(reportsByUser, (reports) => {
      const reportsByWorkdays = map(groupBy(reports, r => r.date))
      return {
        reports,
        totalHours: sumBy(reports, r => r.duration),
        numberOfWorkdays: reportsByWorkdays.length
      }
    })
  } else if (group === 'activity') {
    const reportsByActivity = groupBy(reports, r => r.activityId)
    return mapValues(reportsByActivity, (reports, activityId) => {
      const activity = activities.find(({id}) => id === activityId)
      return {
        reports,
        ...calculateActivitySum(reports)
      }
    })
  } else {
    return reports
  }
}

function populate(reports, users, clients, activities) {
  reports.forEach(report => {
    const user = users.find(({id}) => Number(id) === report.userId)
    const client = clients.find(({id}) => Number(id) === report.clientId)
    const activity = activities.find(({id}) => id === report.activityId)
    report.username = get(user, 'displayName')
    report.activityName = get(activity, 'name')
    report.clientName = get(client, 'name')
  })
}

function calculateActivitySum(reports) {
  const uniqueWorkingDays = map(groupBy(reports, r => r.date));
  const totalHours = sumBy(reports, r => r.duration);

  return {
    totalHours,
    numberOfWorkdays: uniqueWorkingDays.length,
  };
}


module.exports = {
  getReports,

  async getReportsByMonth(month, year, groupBy, filter) {
    if (month > 12 || month < 1) {
      throw new UserError('Month must be between 1 and 12!', {month: 'must be between 1 and 12!'})
    }
    firstTimestamp = new Date(Date.UTC(year, month-1, 1, 0, 0, 0)).toUTCString()
    lastTimestamp = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toUTCString()
    return await getReports(firstTimestamp, lastTimestamp, groupBy, filter)
  },
}
