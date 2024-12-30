import React from 'react'
import {map, sortBy} from 'lodash'
import moment from 'moment'
import memoizeOne from 'memoize-one';
import {Grid, withStyles, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography, TableFooter, TableSortLabel} from '@material-ui/core';
import MultipleSelection from 'common/MultipleSelection'
import ActivityIndicator from 'common/ActivityIndicator'

import {getAllClients} from 'core/clientsService'
import {getReports, getFirstActivityDate} from 'core/reportsService'
import {generateClientsReportCSV} from 'core/csvGenerator'

const styles = theme => ({
  cell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing.unit * 1.5
  },
  title: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit
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

class ClientsReport extends React.Component {

  state = {
    loading: true,
    startDate: '',
    clients: [],
    clientsFilter: [],
    months: [],
    reportsByClient: {},
    orderBy: '',
    orderDirection: 'asc'
  }

  constructor(props) {
    super(props)
    this.init()
  }

  async init() {
    const [clients, firstDate] = await Promise.all([
      getAllClients(),
      getFirstActivityDate()
    ])

    const months = makeMonthsList(firstDate)

    this.setState({
      clients,
      months,
      startDate: months[months.length-1],
      loading: false
    })

    this.load()
  }

  async load() {
    const {startDate, clientsFilter} = this.state
    this.setState({loading: true})
    const endDate = moment.utc(startDate.date).add(1, 'months').toISOString()
    const reportsByClient = await getReports(startDate.date, endDate, 'client', {
      clients: clientsFilter.map(client => client._id),
    })
    this.setState({
      loading: false,
      reportsByClient
    })
  }

  updateFilter(key, val) {
    this.setState({
      [key]: val
    })
  }

  downloadCSV() {
    const {reportsByClient, startDate, clientsFilter} = this.state
    const basename = clientsFilter.length !== 1 ? 'clients' : clientsFilter[0].name.replace(/ /g, '-')
    const timestamp = moment(startDate.date).format('YYYY-MM')

    generateClientsReportCSV(reportsByClient, `${basename}-${timestamp}.csv`)
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

  render() {
    const {classes} = this.props
    const {loading, months, startDate, reportsByClient, clients, clientsFilter, orderBy, orderDirection} = this.state
    return (
      <Grid container direction='column'>
        <Grid container spacing={8} justify='space-evenly'>
          <Grid item xs={4}>
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
          <Grid item xs={1}>
            <Button
              color='primary'
              variant='contained'
              disabled={loading || !startDate}
              onClick={this.load}
            >
              הצג
            </Button>
          </Grid>
          <Grid item xs={1}>
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
        <Grid item>
          {loading ? <ActivityIndicator /> : map(reportsByClient,
            ({reports, totalHours, numberOfWorkdays}, clientId) => (
              <React.Fragment key={clientId}>
                <Typography variant='title' gutterBottom className={classes.title}>
                  {reports[0].clientName}
                </Typography>
                <Paper>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <HeaderCell field='date' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>תאריך</HeaderCell>
                        <HeaderCell field='weekday' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>יום</HeaderCell>
                        <HeaderCell field='startTime' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>זמן התחלה</HeaderCell>
                        <HeaderCell field='endTime' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>זמן סיום</HeaderCell>
                        <HeaderCell field='duration' selectedField={orderBy} selectedDirection={orderDirection} onClick={this.applySort}>מס שעות</HeaderCell>
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
                          {totalHours}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} />
                        <TableCell className={classes.cell}>
                          ימי עבודה
                        </TableCell>
                        <TableCell className={classes.cell}>
                          {numberOfWorkdays}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </Paper>
              </React.Fragment>
            )
          )}
        </Grid>
      </Grid>
    )
  }
}

export default withStyles(styles)(ClientsReport)

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
