import apiClient from 'core/apiClient'
import querystring from 'querystring'
import moment from 'moment';

export async function getReports(startDate, endDate, group, filter) {
  const query = {
    startDate,
    endDate
  }
  if (group) {
    query.group = group
  }
  if (filter) {
    Object.keys(filter).forEach(key => {
      query[`filter[${key}]`] = filter[key]
    })
  }
  const {data} = await apiClient.get(`/reports?${querystring.stringify(query)}`)
  return data
}

export async function getFirstActivityDate() {
  return moment.utc({hours:0, minutes:0, seconds:0, milliseconds:0}).add(-4, 'months').toISOString()
}
