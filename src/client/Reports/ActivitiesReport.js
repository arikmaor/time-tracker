import React from 'react';
import { map, sortBy, get } from 'lodash';
import moment from 'moment';
import memoizeOne from 'memoize-one';
import { Grid, Button, Paper, Typography } from '@mui/material';
import withStyles from "@mui/styles/withStyles";
import * as timetrackingService from 'core/timetrackingService';
import { getAllActivities } from 'core/activitiesService';
import { getAllClients } from 'core/clientsService';
import MultipleSelection from 'common/MultipleSelection';
import ActivityIndicator from 'common/ActivityIndicator';
import EditableTable from '../common/EditableTable';

import { getAllUsers } from 'core/usersService';
import { getReports, getFirstActivityDate } from 'core/reportsService';
import { generateUsersReportCSV } from 'core/csvGenerator';

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
    return reports;
  }

  const _orderBy = orderBy !== 'weekday' ? orderBy : ({ date }) => ((moment(date).day() + 1) % 7);

  const sortedData = sortBy(reports, _orderBy);
  if (orderDirection === 'desc') {
    sortedData.reverse();
  }
  return sortedData;
});

const NEW_PREFIX = 'new_';
let dummyIdCounter = 0;

class ActivityReport extends React.Component {
  state = {
    loading: true,
    startDate: '',
    activities: [],
    activitiesFilter: [],
    months: [],
    clients: [],
    users: [],
    reportsByActivity: {},
    orderBy: '',
    orderDirection: 'asc'
  };

  constructor(props) {
    super(props);
    this.init();
  }

  async init() {
    const [users, clients, firstDate, allActivities] = await Promise.all([
      getAllUsers(),
      getAllClients(),
      getFirstActivityDate(),
      getAllActivities()
    ]);

    const months = makeMonthsList(firstDate);

    this.setState({
      users,
      months,
      clients,
      startDate: months[months.length - 1],
      loading: false,
      activities: allActivities
    });

    this.load();
  }

  async load() {
    if (!this.state.startDate) return;

    const { startDate, activitiesFilter } = this.state;
    this.setState({ loading: true });
    const endDate = moment.utc(startDate.date).add(1, 'months').toISOString();
    const reportsByActivity = await getReports(startDate.date, endDate, 'activity', {
      activities: activitiesFilter.map(activity => activity._id)
    });
    this.setState({
      loading: false,
      reportsByActivity
    });
  }

  updateFilter(key, val) {
    this.setState({
      [key]: val
    });
  }

  downloadCSV() {
    const { reportsByActivity, startDate, activitiesFilter } = this.state;
    console.log(activitiesFilter)
    const basename = activitiesFilter.length !== 1 ? 'activities' : activitiesFilter[0].name.replace(/ /g, '-');
    const timestamp = moment(startDate.date).format('YYYY-MM');
    generateUsersReportCSV(reportsByActivity, `${basename}-${timestamp}.csv`);
  }

  getReportWeekday(report) {
    if (!get(report, 'date')) {
      return '';
    }
    try {
      return moment(report.date).format('dddd');
    } catch (err) {
      console.error(err);
      return '';
    }
  }

  applySort(key) {
    const { orderBy, orderDirection } = this.state;
    if (orderBy !== key) {
      this.setState({
        orderBy: key,
        orderDirection: 'asc'
      });
      return;
    }

    this.setState({
      orderDirection: orderDirection === 'asc' ? 'desc' : 'asc'
    });
  }

  async saveReport(report) {
    const { _id, ...reportData } = report;

    const isNew = report._id.startsWith(NEW_PREFIX);

    const updatedReport = isNew
      ? await timetrackingService.addTimeTrackingReport(reportData)
      : await timetrackingService.updateTimeTrackingReport(_id, reportData);

    this.setState(prevState => {
      const updatedActivityReports = prevState.reportsByActivity[updatedReport.activityId].reports.map(r => r._id === _id ? updatedReport : r);

      const updatedReportsByActivity = {
        ...prevState.reportsByActivity,
        [updatedReport.activityId]: {
          ...prevState.reportsByActivity[updatedReport.activityId],
          reports: [...updatedActivityReports],
          totalHours: updatedActivityReports.reduce((sum, r) => sum + r.duration, 0)
        }
      };

      return {
        ...prevState,
        reportsByActivity: updatedReportsByActivity
      };
    });
  }

  async deleteReport(report) {
    await timetrackingService.deleteTimeTrackingReport(report._id);

    this.setState(prevState => {
      const updatedActivityReports = prevState.reportsByActivity[report.activityId].reports.filter(r => r._id !== report._id);

      const updatedReportsByActivity = {
        ...prevState.reportsByActivity,
        [report.activityId]: {
          ...prevState.reportsByActivity[report.activityId],
          reports: updatedActivityReports,
          totalHours: updatedActivityReports.reduce((sum, r) => sum + r.duration, 0)
        }
      };

      return {
        ...prevState,
        reportsByActivity: updatedReportsByActivity
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
      const activityReports = prevState.reportsByActivity[report.activityId].reports;
      const reportIndex = activityReports.findIndex(r => r._id === report._id);

      // Insert the cloned report at the next index
      const updatedActivityReports = [
        ...activityReports.slice(0, reportIndex + 1),
        clonedReport,
        ...activityReports.slice(reportIndex + 1)
      ];

      const updatedReportsByActivity = {
        ...prevState.reportsByActivity,
        [report.activityId]: {
          ...prevState.reportsByActivity[report.activityId],
          reports: updatedActivityReports,
          totalHours: updatedActivityReports.reduce((sum, r) => sum + r.duration, 0)
        }
      };

      return {
        ...prevState,
        reportsByActivity: updatedReportsByActivity
      };
    });
  }

  render() {
    const { classes } = this.props;
    const { loading, users, months, startDate, reportsByActivity, activitiesFilter, orderBy, orderDirection, activities, clients } = this.state;

    return (
      <Grid container direction='column' padding={1}>
        <Grid container justifyContent='space-between'>
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
            <Grid item xs={8}>
              <MultipleSelection
                label='פעילויות'
                disabled={loading}
                value={activitiesFilter}
                onChange={value => this.updateFilter('activitiesFilter', value)}
                data={activities}
                displayField='name'
              />
            </Grid>
          </Grid>
          <Grid container item md={2} justifyContent='flex-end' alignItems='center'>
            <Grid item md={4}>
              <Button
                color='primary'
                variant='contained'
                disabled={loading || !startDate}
                onClick={this.load}
              >
                הצג
              </Button>
            </Grid>
            <Grid item md={4}>
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
          {loading ? <ActivityIndicator /> : map(reportsByActivity,
            ({ reports, totalHours, numberOfWorkdays }, activityId) => (
              <React.Fragment key={activityId}>
                <Typography variant='title' gutterBottom className={classes.title}>
                  {reports[0].activityName}
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
                    },
                    {
                      id: 'duration',
                      title: 'מס שעות',
                      type: 'number',
                      sortable: true
                    },
                    {
                      id: 'clientId',
                      title: 'לקוח',
                      select: clients,
                      idField: '_id',
                      displayField: 'name',
                      sortable: true
                    },
                     {
                      id: 'userId',
                      title: 'עובד',
                      select: users,
                      idField: '_id',
                      displayField: 'displayName',
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
                      transform: ({ modifiedAt }) => moment(modifiedAt).format('HH:mm D/MM/YYYY'),
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
    );
  }
}

export default withStyles(styles)(ActivityReport);

function makeMonthsList(firstDate) {
  const now = moment.utc();
  let m = moment.utc(firstDate).date(1);
  const ret = [];
  while (m.isSameOrBefore(now)) {
    ret.push({
      date: m.toISOString(),
      display: m.format('YYYY MMMM')
    });
    m = m.add(1, 'months');
  }
  return ret;
}