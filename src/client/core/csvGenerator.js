import fileDownload from 'downloadjs'
import {reduce} from 'lodash'

const UNIVERSAL_BOM = '\uFEFF'
const HEADERS = {
  date: 'תאריך',
  startTime: 'זמן התחלה',
  endTime: 'זמן סיום',
  duration: 'מס שעות',
  clientName: 'לקוח',
  activityName: 'פעילות',
  username: 'עובד',
  notes: 'הערות',
  modifiedAt: 'זמן עדכון'
}

export function generateTimeTrackingCSV(data, filename) {
  const csv = _arrayToCSV(data, 'date', 'startTime', 'endTime', 'duration', 'clientName', 'activityName', 'notes', 'modifiedAt')
  fileDownload(UNIVERSAL_BOM + csv, filename, "text/csv;charset=utf-8")
}

export function generateAdvancedReportCSV(data, filename) {
  const {reports, totalHours, numberOfWorkdays} = data
  
  let csv = _arrayToCSV(reports, 'date', 'startTime', 'endTime', 'duration', 'clientName', 'username', 'activityName', 'notes', 'modifiedAt')
  csv += `סה״כ שעות,${totalHours}\n`
  csv += `מספר ימי עבודה,${numberOfWorkdays}\n\n`
  fileDownload(UNIVERSAL_BOM + csv, filename, "text/csv;charset=utf-8")
}

export function generateClientsReportCSV(data, filename) {
  const csv = reduce(data,
    (csv, {reports, totalHours, numberOfWorkdays}) => csv +
      _arrayToCSV(reports, 'date', 'startTime', 'endTime', 'duration', 'clientName', 'username', 'activityName', 'notes', 'modifiedAt') +
      `סה״כ שעות,${totalHours}\n` +
      `מספר ימי עבודה,${numberOfWorkdays}\n\n`,
    '')
  fileDownload(UNIVERSAL_BOM + csv, filename, "text/csv;charset=utf-8")
}

export function generateUsersReportCSV(data, filename) {
  const csv = reduce(data,
    (csv, {reports, totalHours, numberOfWorkdays, salary, travelSalary, totalSalary}) => csv +
      _arrayToCSV(reports, 'date', 'startTime', 'endTime', 'duration', 'clientName', 'username', 'activityName', 'notes', 'modifiedAt') +
      `סה״כ שעות,${totalHours}\n` +
      `מספר ימי עבודה,${numberOfWorkdays}\n\n`,
    '')
  fileDownload(UNIVERSAL_BOM + csv, filename, "text/csv;charset=utf-8")
}

function _arrayToCSV(arr, ...fields) {
  const headers = `${fields.map(field => HEADERS[field] || field).join(',')}\n`
  return arr.reduce(
    (csv, item) => csv +
      fields.reduce((line, field) => line ? `${line},${item[field] || ''}` : (item[field] || ''), '') + '\n',
    headers
  )
}
