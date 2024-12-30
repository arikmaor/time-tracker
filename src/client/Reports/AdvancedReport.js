import React from 'react'
import _, {sortBy, sumBy, uniq, uniqBy, map} from 'lodash'
import moment from 'moment'
import memoizeOne from 'memoize-one';
import { Grid, withStyles, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableFooter, TableSortLabel } from '@material-ui/core';
import TextField from 'common/TextField'
import MultipleSelection from 'common/MultipleSelection'
import ActivityIndicator from 'common/ActivityIndicator'

import {getAllClients} from 'core/clientsService'
import {getAllUsers} from 'core/usersService'
import {getAllActivities} from 'core/activitiesService'
import {getReports} from 'core/reportsService'
import {generateAdvancedReportCSV} from 'core/csvGenerator'

const styles = theme => ({
  cell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing.unit * 1.5
  }
})

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

const sumOfUniqueDates = (data) => {
  return _(data)
      .groupBy('userId') // Group by userId
      .mapValues(entries => 
          _(entries)
              .map('date') // Extract the date field
              .uniq() // Get unique dates
              .size() // Count the unique dates
      )
      .values() // Get the counts as an array
      .sum(); // Sum the counts
}

const HeaderCell = withStyles(styles)(({classes, field, selectedField, selectedDirection, onClick, children}) => (
  <TableCell className={classes.cell}>
    <TableSortLabel
      active={selectedField === field}
      direction={selectedDirection}
      onClick={() => onClick && onClick(field)}
    >
      {children}
    </TableSortLabel>
  </TableCell>
))

const searchPeriodTypes = [
  {
    label: 'חיפוש ידני',
    value: 0,
  },
  {
    label: '3 חודשים אחרונים',
    value: 3,
  },
  {
    label: '6 חודשים אחרונים',
    value: 6,
  },
  {
    label: '12 חודשים אחרונים',
    value: 12,
  }
]

class AdvancedReport extends React.Component {

  state = {
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().add(1, 'day').format('YYYY-MM-DD'),
    loading: true,
    searchPeriodType: searchPeriodTypes[0],
    clients: [],
    clientsFilter: [],
    activities: [],
    activitiesFilter: [],
    users: [],
    usersFilter: [],
    reports: [],
    orderBy: '',
    orderDirection: 'asc'
  }

  constructor(props) {
    super(props)
    this.init()
  }

  async init() {
    const [clients, users, activities] = await Promise.all([
      getAllClients(),
      getAllUsers(),
      getAllActivities()
    ])

    this.setState({
      clients,
      users,
      activities,
      loading: false
    })
  }

  async load() {
    const {startDate, endDate, clientsFilter, usersFilter, activitiesFilter} = this.state
    this.setState({loading: true})
    const reports = await getReports(startDate, endDate, null, {
      clients: clientsFilter.map(client => client._id),
      users: usersFilter.map(user => user._id),
      activities: activitiesFilter.map(activity => activity._id)
    })
    this.setState({
      loading: false,
      reports
    })
  }

  updateFilter(key, val) {
    this.setState({
      [key]: val
    })
  }

  downloadCSV() {
    const {reports, startDate, endDate, clientsFilter, usersFilter, activitiesFilter} = this.state
    const timestamp = `${moment(startDate).format('YYYY-MM-DD')}-${moment(endDate).format('YYYY-MM-DD')}`
    let basename = ''
    if (clientsFilter.length === 1) {
      basename += clientsFilter[0].name.replace(/ /g, '-') + '-'
    }
    if (usersFilter.length === 1) {
      basename += usersFilter[0].displayName.replace(/ /g, '-') + '-'
    }
    if (activitiesFilter.length === 1) {
      basename += activitiesFilter[0].name.replace(/ /g, '-') + '-'
    }
    if (!basename) {
      basename = 'report-'
    }
    const reportToDownload = {
      reports,
      totalHours: sumBy(reports, 'duration'),
      numberOfWorkdays: sumOfUniqueDates(reports)
    }

    generateAdvancedReportCSV(reportToDownload, `${basename}${timestamp}.csv`)
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

  updateSearchPeriodType = (periodObject) => {
    const {value} = periodObject

    this.setState({
      searchPeriodType: periodObject,
      startDate: moment().add(-value, 'months').format('YYYY-MM-DD'),
      endDate: moment().add(1, 'day').format('YYYY-MM-DD')
    })
  }

  render() {
    const {classes} = this.props
    const {
      loading,
      searchPeriodType,
      reports,
      startDate,
      endDate,
      clients,
      clientsFilter,
      activities,
      activitiesFilter,
      users,
      usersFilter,
      orderBy,
      orderDirection
    } = this.state
    const sumTotalHours = sumBy(reports, 'duration')
    const distinctWorkingDays = sumOfUniqueDates(reports)

    return (
      <Grid container direction='column' spacing={16}>
        <Grid container justify='space-between' spacing={16}>
          <Grid container item xs={9} justify='flex-start' alignItems='center'>
            <Grid item xs={3}>
              <MultipleSelection
                label='טווח תאריכים'
                single={true}
                disabled={loading}
                value={searchPeriodType}
                onChange={this.updateSearchPeriodType}
                data={searchPeriodTypes}
                displayField='label'
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth={true}
                disabled={loading || searchPeriodType.value !== 0}
                label='התחלה'
                type='date'
                value={startDate}
                onChange={e => this.updateFilter('startDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth={true}
                disabled={loading || searchPeriodType.value !== 0}
                label='סיום'
                type='date'
                value={endDate}
                onChange={e => this.updateFilter('endDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <MultipleSelection
                label='לקוחות'
                disabled={loading}
                value={clientsFilter}
                onChange={value => this.updateFilter('clientsFilter', value)}
                data={clients}
                displayField='name'
              />
            </Grid>
            <Grid item xs={4}>
              <MultipleSelection
                label='פעילויות'
                disabled={loading}
                value={activitiesFilter}
                onChange={value => this.updateFilter('activitiesFilter', value)}
                data={activities}
                displayField='name'
              />
            </Grid>
            <Grid item xs={4}>
              <MultipleSelection
                label='עובדים'
                disabled={loading}
                value={usersFilter}
                onChange={value => this.updateFilter('usersFilter', value)}
                data={users}
                displayField='displayName'
              />
            </Grid>
          </Grid>
          <Grid container item justify='flex-end' xs={2} spacing={8} alignItems='center'>
            <Grid item xs={5}>
              <Button
                color='primary'
                variant='contained'
                disabled={loading || !startDate || !endDate}
                onClick={this.load}
              >
                הצג
              </Button>
            </Grid>
            <Grid item xs={5}>
              <Button
                color='primary'
                variant='contained'
                disabled={loading || !startDate || !endDate}
                onClick={this.downloadCSV}
              >
                CSV
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          {loading ? <ActivityIndicator /> : (reports.length > 0 &&
            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <HeaderCell field='date' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>תאריך</HeaderCell>
                    <HeaderCell field='weekday' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>יום</HeaderCell>
                    <HeaderCell field='startTime' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>זמן התחלה</HeaderCell>
                    <HeaderCell field='endTime' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>זמן סיום</HeaderCell>
                    <HeaderCell field='duration' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>מס שעות</HeaderCell>
                    <HeaderCell field='clientName' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>לקוח</HeaderCell>
                    <HeaderCell field='username' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>עובד</HeaderCell>
                    <HeaderCell field='activityName' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>פעילות</HeaderCell>
                    <HeaderCell field='notes' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>הערות</HeaderCell>
                    <HeaderCell field='modifiedAt' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>זמן עדכון</HeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getSortedData(reports, orderBy, orderDirection).map(report => {
                    const m = moment(report.date)
                    return (
                      <TableRow key={report._id}>
                        <TableCell className={classes.cell}>{m.format('D/MM/YYYY')}</TableCell>
                        <TableCell className={classes.cell}>{m.format('dddd')}</TableCell>
                        <TableCell className={classes.cell}>{report.startTime}</TableCell>
                        <TableCell className={classes.cell}>{report.endTime}</TableCell>
                        <TableCell className={classes.cell}>{report.duration}</TableCell>
                        <TableCell className={classes.cell}>{report.clientName}</TableCell>
                        <TableCell className={classes.cell}>{report.username}</TableCell>
                        <TableCell className={classes.cell}>{report.activityName}</TableCell>
                        <TableCell className={classes.cell}>{report.notes}</TableCell>
                        <TableCell className={classes.cell}>{moment(report.modifiedAt).format('HH:mm D/MM/YYYY')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} />
                        <TableCell className={classes.cell}>
                          שעות עבודה
                        </TableCell>
                        <TableCell className={classes.cell}>
                          {sumTotalHours}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} />
                        <TableCell className={classes.cell}>
                          ימי עבודה
                        </TableCell>
                        <TableCell className={classes.cell}>
                          {distinctWorkingDays}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
              </Table>
            </Paper>
          )}
        </Grid>
      </Grid>
    )
  }
}

export default withStyles(styles)(AdvancedReport)
