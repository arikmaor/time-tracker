import React from "react";
import _, { sortBy, sumBy } from "lodash";
import moment from "moment";
import memoizeOne from "memoize-one";
import {
  Grid,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TextField,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MultipleSelection from "common/MultipleSelection";
import { getAllClients } from "core/clientsService";
import { getAllUsers } from "core/usersService";
import { getAllActivities } from "core/activitiesService";
import { getReports } from "core/reportsService";
import { generateAdvancedReportCSV } from "core/csvGenerator";

const PREFIX = "AdvancedReport";

const classes = {
  root: `${PREFIX}-root`,
  cell: `${PREFIX}-cell`,
  button: `${PREFIX}-button`,
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.root}`]: {
    margin: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  [`& .${classes.cell}`]: {
    fontSize: "1.25rem",
    textAlign: "right",
    padding: theme.spacing(1.5),
  },
  [`& .${classes.button}`]: {
    margin: theme.spacing(1),
  },
}));

const getSortedData = memoizeOne((reports = [], orderBy, orderDirection) => {
  if (!orderBy) {
    return reports;
  }

  const _orderBy =
    orderBy !== "weekday"
      ? orderBy
      : ({ date }) => (moment(date).day() + 1) % 7;

  const sortedData = sortBy(reports, _orderBy);
  if (orderDirection === "desc") {
    sortedData.reverse();
  }
  return sortedData;
});

const sumOfUniqueDates = (data) => {
  return _(data)
    .groupBy("userId")
    .mapValues((entries) =>
      _(entries)
        .map("date")
        .uniq()
        .size()
    )
    .values()
    .sum();
};

const searchPeriodTypes = [
  { label: "חיפוש ידני", value: 0 },
  { label: "3 חודשים אחרונים", value: 3 },
  { label: "6 חודשים אחרונים", value: 6 },
  { label: "12 חודשים אחרונים", value: 12 },
];

class AdvancedReport extends React.Component {
  state = {
    startDate: moment().format("YYYY-MM-DD"),
    endDate: moment().add(1, "day").format("YYYY-MM-DD"),
    loading: true,
    searchPeriodType: searchPeriodTypes[0],
    clients: [],
    clientsFilter: [],
    activities: [],
    activitiesFilter: [],
    users: [],
    usersFilter: [],
    reports: [],
    orderBy: "",
    orderDirection: "asc",
  };

  async componentDidMount() {
    try {
      const [clients, users, activities] = await Promise.all([
        getAllClients(),
        getAllUsers(),
        getAllActivities(),
      ]);

      this.setState({
        clients,
        users,
        activities,
        loading: false,
      });
    } catch (error) {
      console.error("Error initializing data:", error);
      this.setState({ loading: false });
    }
  }

  async loadReports() {
    const {
      startDate,
      endDate,
      clientsFilter,
      usersFilter,
      activitiesFilter,
    } = this.state;

    this.setState({ loading: true });

    try {
      const reports = await getReports(startDate, endDate, null, {
        clients: clientsFilter.map((client) => client._id),
        users: usersFilter.map((user) => user._id),
        activities: activitiesFilter.map((activity) => activity._id),
      });

      this.setState({
        loading: false,
        reports,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
      this.setState({ loading: false });
    }
  }

  updateFilter = (key, value) => {
    this.setState({ [key]: value });
  };

  updateSearchPeriodType = (periodObject) => {
    const {value} = periodObject

    this.setState({
      searchPeriodType: periodObject,
      startDate: moment().add(-value, 'months').format('YYYY-MM-DD'),
      endDate: moment().add(1, 'day').format('YYYY-MM-DD')
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

  applySort = (key) => {
    const { orderBy, orderDirection } = this.state;
    this.setState({
      orderBy: key,
      orderDirection: orderBy === key && orderDirection === "asc" ? "desc" : "asc",
    });
  };

  render() {
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
      orderDirection,
    } = this.state;

    const sumTotalHours = sumBy(reports, "duration");
    const distinctWorkingDays = sumOfUniqueDates(reports);

    return (
      <StyledBox className={classes.root}>
        <Box display="flex" marginBottom={2} alignItems='center' justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" flexWrap="wrap" gap={2} width="88%">
            <Box flex="1 1 25%">
              <MultipleSelection
                label='טווח תאריכים'
                single={true}
                disabled={loading}
                value={searchPeriodType}
                onChange={this.updateSearchPeriodType}
                data={searchPeriodTypes}
                displayField='label'
              />
            </Box>
            <Box flex="1 1 25%">
              <TextField
                fullWidth
                disabled={loading || searchPeriodType.value !== 0}
                label="התחלה"
                type="date"
                value={startDate}
                onChange={(e) => this.updateFilter("startDate", e.target.value)}
              />
            </Box>
            <Box flex="1 1 25%">
              <TextField
                fullWidth
                disabled={loading || searchPeriodType.value !== 0}
                label="סיום"
                type="date"
                value={endDate}
                onChange={(e) => this.updateFilter("endDate", e.target.value)}
              />
            </Box>
            <Box flex="1 1 25%">
              <MultipleSelection
                label="לקוחות"
                disabled={loading}
                value={clientsFilter}
                onChange={(value) => this.updateFilter("clientsFilter", value)}
                data={clients}
                displayField="name"
              />
            </Box>
            <Box flex="1 1 25%">
              <MultipleSelection
                label="פעילויות"
                disabled={loading}
                value={activitiesFilter}
                onChange={(value) => this.updateFilter("activitiesFilter", value)}
                data={activities}
                displayField="name"
              />
            </Box>
            <Box flex="1 1 25%">
              <MultipleSelection
                label="עובדים"
                disabled={loading}
                value={usersFilter}
                onChange={(value) => this.updateFilter("usersFilter", value)}
                data={users}
                displayField="displayName"
              />
            </Box>
          </Box>
          <Box display="flex" margin={1} flexDirection="column" gap={1} width="8%">
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={() => this.loadReports()}
              disabled={loading}
            >
              הצג
            </Button>
            <Button
              color="secondary"
              variant="contained"
              className={classes.button}
              onClick={this.downloadCSV}
              disabled={!reports.length}
            >
              הורד CSV
            </Button>
          </Box>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : !reports.length ? null : (
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>תאריך</TableCell>
                  <TableCell>יום</TableCell>
                  <TableCell>זמן התחלה</TableCell>
                  <TableCell>זמן סיום</TableCell>
                  <TableCell>מס שעות</TableCell>
                  <TableCell>לקוח</TableCell>
                  <TableCell>עובד</TableCell>
                  <TableCell>פעילות</TableCell>
                  <TableCell>הערות</TableCell>
                  <TableCell>זמן עדכון</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedData(reports, orderBy, orderDirection).map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>{moment(report.date).format("D/MM/YYYY")}</TableCell>
                    <TableCell>{moment(report.date).format("dddd")}</TableCell>
                    <TableCell>{report.startTime}</TableCell>
                    <TableCell>{report.endTime}</TableCell>
                    <TableCell>{report.duration}</TableCell>
                    <TableCell>{report.clientName}</TableCell>
                    <TableCell>{report.username}</TableCell>
                    <TableCell>{report.activityName}</TableCell>
                    <TableCell>{report.notes}</TableCell>
                    <TableCell>{moment(report.modifiedAt).format("HH:mm D/MM/YYYY")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} />
                  <TableCell>שעות עבודה</TableCell>
                  <TableCell>{sumTotalHours}</TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} />
                  <TableCell>ימי עבודה</TableCell>
                  <TableCell>{distinctWorkingDays}</TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
              </TableFooter>
            </Table>
          </Paper>
        )}
      </StyledBox>
    );
  }
}

export default AdvancedReport;
