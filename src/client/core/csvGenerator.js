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

function safeCSVValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes
  }
  return stringValue;
}

export function generateTimeTrackingCSV(data, filename) {
  const { reports, totalHours, numberOfWorkdays } = data;

  // Generate CSV from reports
  let csv = _arrayToCSV(
    reports,
    'date',
    'startTime',
    'endTime',
    'duration',
    'clientName',
    'activityName',
    'notes',
    'modifiedAt'
  );

  // Append summary rows
  csv += `סה״כ שעות,${safeCSVValue(totalHours)}\n`;
  csv += `מספר ימי עבודה,${safeCSVValue(numberOfWorkdays)}\n\n`;

  // Add UTF-8 BOM and download the file
  const UNIVERSAL_BOM = '\uFEFF';
  fileDownload(UNIVERSAL_BOM + csv, filename, 'text/csv;charset=utf-8');
}

export function generateAdvancedReportCSV(data, filename) {
  const { reports = [], totalHours = 0, numberOfWorkdays = 0 } = data;

  let csv = _arrayToCSV(
    reports.map((report) => ({
      date: safeCSVValue(report.date),
      startTime: safeCSVValue(report.startTime),
      endTime: safeCSVValue(report.endTime),
      duration: safeCSVValue(report.duration),
      clientName: safeCSVValue(report.clientName),
      username: safeCSVValue(report.username),
      activityName: safeCSVValue(report.activityName),
      notes: safeCSVValue(report.notes),
      modifiedAt: safeCSVValue(report.modifiedAt),
    })),
    'date',
    'startTime',
    'endTime',
    'duration',
    'clientName',
    'username',
    'activityName',
    'notes',
    'modifiedAt'
  );

  // Append summary rows
  csv += `סה״כ שעות,${safeCSVValue(totalHours)}\n`;
  csv += `מספר ימי עבודה,${safeCSVValue(numberOfWorkdays)}\n\n`;

  // Add UTF-8 BOM for proper encoding
  const UNIVERSAL_BOM = '\uFEFF';
  fileDownload(UNIVERSAL_BOM + csv, filename, 'text/csv;charset=utf-8');
}

export function generateClientsReportCSV(data, filename) {
  const csv = reduce(
    data,
    (csv, { reports, totalHours, numberOfWorkdays }) => {
      const csvReports = _arrayToCSV(
        reports.map((report) => ({
          date: report.date,
          startTime: report.startTime,
          endTime: report.endTime,
          duration: report.duration,
          clientName: safeCSVValue(report.clientName),
          username: safeCSVValue(report.username),
          activityName: safeCSVValue(report.activityName),
          notes: safeCSVValue(report.notes),
          modifiedAt: report.modifiedAt,
        })),
        'date',
        'startTime',
        'endTime',
        'duration',
        'clientName',
        'username',
        'activityName',
        'notes',
        'modifiedAt'
      );
  
      return (
        csv +
        csvReports +
        `סה״כ שעות,"${totalHours}"\n` +
        `מספר ימי עבודה,"${numberOfWorkdays}"\n\n`
      );
    },
    ''
  );
  fileDownload(UNIVERSAL_BOM + csv, filename, "text/csv;charset=utf-8")
}

export function generateUsersReportCSV(data, filename) {
  const csv = reduce(
    data,
    (csv, { reports, totalHours, numberOfWorkdays }) => {
      const csvReports = _arrayToCSV(
        reports.map((report) => ({
          date: safeCSVValue(report.date),
          startTime: safeCSVValue(report.startTime),
          endTime: safeCSVValue(report.endTime),
          duration: safeCSVValue(report.duration),
          clientName: safeCSVValue(report.clientName),
          username: safeCSVValue(report.username),
          activityName: safeCSVValue(report.activityName),
          notes: safeCSVValue(report.notes),
          modifiedAt: safeCSVValue(report.modifiedAt),
        })),
        'date',
        'startTime',
        'endTime',
        'duration',
        'clientName',
        'username',
        'activityName',
        'notes',
        'modifiedAt'
      );
  
      return (
        csv +
        csvReports +
        `סה״כ שעות,${safeCSVValue(totalHours)}\n` +
        `מספר ימי עבודה,${safeCSVValue(numberOfWorkdays)}\n\n`
      );
    },
    ''
  );
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
