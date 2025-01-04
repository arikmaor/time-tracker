import React from 'react'
import {map, sortBy, get} from 'lodash'
import moment from 'moment'
import memoizeOne from 'memoize-one';
import {Grid, Button, Paper, Typography} from '@mui/material';
import withStyles from "@mui/styles/withStyles";
import * as timetrackingService from 'core/timetrackingService'
import {getAllActivities} from 'core/activitiesService'
import {getAllClients} from 'core/clientsService'
import MultipleSelection from 'common/MultipleSelection'
import ActivityIndicator from 'common/ActivityIndicator'
import EditableTable from '../common/EditableTable'

import {getAllUsers} from 'core/usersService'
import {getReports, getFirstActivityDate} from 'core/reportsService'
import {generateUsersReportCSV} from 'core/csvGenerator'

const styles = (theme) => ({
  cell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing(1.5), // Updated spacing API
  },
  title: {
    lineHeight: '3rem',
    fontSize: '1.2rem',
  },
});


const getSortedData = memoizeOne((reports = [], orderBy, orderDirection) => {
  if (!orderBy) {
    return reports
  }

  const _orderBy = orderBy !== 'weekday' ? orderBy : ({date}) => ((moment(date).day()+1)%7)

  const sortedData = sortBy(reports, _orderBy)
  if (orderDirection === 'desc') {
    sortedData.reverse()
  }
  return sortedData
})

const NEW_PREFIX = 'new_'
let dummyIdCounter = 0

const EMPLOYMENT_TYPES = [
  {title: 'שכיר', _id: 'employee'},
  {title: 'עצמאי', _id: 'contractor'},
]

class UsersReport extends React.Component {

  state = {
    loading: true,
    startDate: '',
    users: [],
    usersFilter: [],
    employmentTypeFilter: [],
    months: [],
    reportsByUser: {},
    orderBy: '',
    orderDirection: 'asc'
  }

  constructor(props) {
    super(props)
    this.init()
  }

  async init() {
    const [users, firstDate, clients, allActivities] = await Promise.all([
      getAllUsers(),
      getFirstActivityDate(),
      getAllClients(),
      getAllActivities()
    ])

    const months = makeMonthsList(firstDate)

    this.setState({
      employmentTypeFilter: EMPLOYMENT_TYPES,
      users,
      months,
      startDate: months[months.length-1],
      loading: false,
      clients,
      activities: clients.reduce((ret, client) => {
        ret[client._id] = allActivities
          .filter(activity => client.activities.some(({activityId}) => activityId === activity._id))
        return ret
      }, {}),
    })

    this.load()
  }

  async load() {
    if (!this.state.startDate) return

    const {
      startDate,
      usersFilter,
      employmentTypeFilter,
      users
    } = this.state

    let updatedUserFilter = usersFilter
    if (employmentTypeFilter.length && employmentTypeFilter.length < EMPLOYMENT_TYPES.length) {
      if (usersFilter.length) {
        updatedUserFilter = usersFilter.filter(user => employmentTypeFilter.some(({_id}) => user.type === _id))
      } else {
        updatedUserFilter = users.filter(user => employmentTypeFilter.some(({_id}) => user.type === _id))
      }
    }

    this.setState({loading: true})
    const endDate = moment.utc(startDate.date).add(1, 'months').toISOString()
    const reportsByUser = await getReports(startDate.date, endDate, 'user', {
      users: updatedUserFilter.map(user => user._id),
    })
    this.setState({
      loading: false,
      reportsByUser
    })
  }

  updateFilter(key, val) {
    this.setState({
      [key]: val
    })
  }

  downloadCSV() {
    const {reportsByUser, startDate, usersFilter} = this.state
    const basename = usersFilter.length !== 1 ? 'users' : usersFilter[0].displayName.replace(/ /g, '-')
    const timestamp = moment(startDate.date).format('YYYY-MM')
    generateUsersReportCSV(reportsByUser, `${basename}-${timestamp}.csv`)
  }

  getReportWeekday(report) {
    if (!get(report, 'date')) {
      return ''
    }
    try {
      return moment(report.date).format('dddd')
    } catch (err) {
      console.error(err)
      return ''
    }
  }

  applySort(key) {
    const {orderBy, orderDirection} = this.state
    if (orderBy !== key) {
      this.setState({
        orderBy: key,
        orderDirection: 'asc'
      })
      return
    }

    this.setState({
      orderDirection: orderDirection === 'asc' ? 'desc' : 'asc'
    })
  }

  async saveReport(report) {
    const {_id, ...reportData} = report

    const isNew = report._id.startsWith(NEW_PREFIX)

    const updatedReport = isNew ?
      await timetrackingService.addTimeTrackingReport(reportData) :
      await timetrackingService.updateTimeTrackingReport(_id, reportData)

    this.setState(prevState => {
      const updatedUserReport = prevState.reportsByUser[updatedReport.userId].reports.map(r => r._id === _id ? updatedReport : r);

      const updatedReportsByUser = {
          ...prevState.reportsByUser,
          [updatedReport.userId]: {
              ...prevState.reportsByUser[updatedReport.userId],
              reports: [...updatedUserReport],
              totalHours: updatedUserReport.reduce((sum, r) => sum + r.duration, 0)
          }
      }

      return {
        ...prevState,
        reportsByUser: updatedReportsByUser
      };
    });
  }

  async deleteReport(report) {
      await timetrackingService.deleteTimeTrackingReport(report._id);

      this.setState(prevState => {
          const updatedUserReports = prevState.reportsByUser[report.userId].reports.filter(r => r._id !== report._id);

          const updatedReportsByUser = {
              ...prevState.reportsByUser,
              [report.userId]: {
                  ...prevState.reportsByUser[report.userId],
                  reports: updatedUserReports,
                  totalHours: updatedUserReports.reduce((sum, r) => sum + r.duration, 0)
              }
          };

          return {
            ...prevState,
            reportsByUser: updatedReportsByUser
          };
      });
  }

  async duplicateReport(report) {
    // Clone the report and assign a new unique ID with NEW_PREFIX
    const newId = NEW_PREFIX + (dummyIdCounter++);
    const clonedReport = {
        ...report,
        _id: newId
    };

    this.setState(prevState => {
        const userReports = prevState.reportsByUser[report.userId].reports;
        const reportIndex = userReports.findIndex(r => r._id === report._id);

        // Insert the cloned report at the next index
        const updatedUserReports = [
            ...userReports.slice(0, reportIndex + 1),
            clonedReport,
            ...userReports.slice(reportIndex + 1)
        ];

        const updatedReportsByUser = {
            ...prevState.reportsByUser,
            [report.userId]: {
                ...prevState.reportsByUser[report.userId],
                reports: updatedUserReports,
                totalHours: updatedUserReports.reduce((sum, r) => sum + r.duration, 0)
            }
        };

        return {
            ...prevState,
            reportsByUser: updatedReportsByUser
        };
    });
  }

  render() {
    const {classes} = this.props
    const {
      loading,
      months,
      startDate,
      reportsByUser,
      users,
      usersFilter,
      employmentTypeFilter,
      orderBy,
      orderDirection,
      clients,
      activities
    } = this.state

    return (
      <Grid container direction='column' padding={1}>
        <Grid container justify='space-between'>
          <Grid container item md={8} gap={1}>
            <Grid item xs={2}>
              <MultipleSelection
                label='חודש'
                single={true}
                disabled={loading}
                value={startDate}
                onChange={value => this.updateFilter('startDate', value)}
                data={months}
                displayField='display'
                keyField='date'
              />
            </Grid>
            <Grid item xs={5}>
              <MultipleSelection
                label='עובדים'
                disabled={loading}
                value={usersFilter}
                onChange={value => this.updateFilter('usersFilter', value)}
                data={users}
                displayField='displayName'
              />
            </Grid>
            <Grid item xs={4}>
              <MultipleSelection
                label='שכיר / עצמאי'
                disabled={loading}
                value={employmentTypeFilter}
                onChange={value => this.updateFilter('employmentTypeFilter', value)}
                data={EMPLOYMENT_TYPES}
                keyField='_id'
                displayField='title'
              />
            </Grid>
          </Grid>
          <Grid container item md={4} alignItems='center' justifyContent='flex-end'>
            <Grid item xs={2}>
              <Button
                color='primary'
                variant='contained'
                disabled={loading || !startDate}
                onClick={this.load}
              >
                הצג
              </Button>
            </Grid>
            <Grid justifyContent='flex-end' item xs={1.5}>
              <Button
                color='primary'
                variant='contained'
                disabled={loading || !startDate}
                onClick={this.downloadCSV}
              >
                CSV
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          {loading ? <ActivityIndicator /> : map(reportsByUser,
            ({reports, totalHours, numberOfWorkdays}, clientId) => (
              <React.Fragment key={clientId}>
                <Typography variant='title' gutterBottom className={classes.title}>
                  {reports[0].username}
                </Typography>
                <Paper>
                  <EditableTable
                    data={getSortedData(reports, orderBy, orderDirection)}
                    headers={[{
                      id: 'date',
                      title: 'תאריך',
                      type: 'date',
                      focus: true,
                      sortable: true
                    }, {
                      id: 'weekday',
                      title: 'יום',
                      type: 'computed',
                      transform: this.getReportWeekday,
                      sortable: true
                    }, {
                      id: 'startTime',
                      title: 'זמן התחלה',
                      type: 'time',
                      sortable: true
                    }, {
                      id: 'endTime',
                      title: 'זמן סיום',
                      type: 'time',
                      sortable: true
                    }, {
                      id: 'duration',
                      title: 'מס שעות',
                      type: 'number',
                      sortable: true
                    }, {
                      id: 'clientId',
                      title: 'לקוח',
                      select: clients,
                      idField: '_id',
                      displayField: 'name',
                      sortable: true
                    }, {
                      id: 'activityId',
                      title: 'פעילות',
                      select: ({clientId}) => activities[clientId],
                      idField: '_id',
                      displayField: 'name',
                      sortable: true
                    }, {
                      id: 'notes',
                      title: 'הערות',
                      multiline: true,
                      wide: true
                    }, {
                      id: 'modifiedAt',
                      title: 'זמן עדכון',
                      type: 'computed',
                      transform: ({modifiedAt}) => moment(modifiedAt).format('HH:mm D/MM/YYYY'),
                      sortable: true
                    }]}
                    onSave={this.saveReport}
                    onDelete={this.deleteReport}
                    onDuplicate={this.duplicateReport}
                    footerData={[{
                      cells: [
                        {},
                        {},
                        {},
                        { content: 'שעות עבודה' },
                        { content: totalHours },
                        {},
                        {},
                        {},
                        {},
                        {},
                      ]
                    }, {
                      cells: [
                        {},
                        {},
                        {},
                        { content: 'ימי עבודה' },
                        { content: numberOfWorkdays },
                        {},
                        {},
                        {},
                        {},
                        {},
                      ]
                    }]}
                  />
                </Paper>
              </React.Fragment>
            )
          )}
        </Grid>
      </Grid>
    )
  }
}

export default withStyles(styles)(UsersReport)

function makeMonthsList(firstDate) {
  const now = moment.utc()
  let m = moment.utc(firstDate).date(1)
  const ret = []
  while (m.isSameOrBefore(now)) {
    ret.push({
      date: m.toISOString(),
      display: m.format('YYYY MMMM')
    })
    m = m.add(1, 'months')
  }
  return ret
}
