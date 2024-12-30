import React from "react";
import PropTypes from "prop-types";
import { Prompt } from "react-router-dom";
import { get, uniq } from "lodash";
import Grid from "@material-ui/core/Grid";
import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";

import IconButton from "@material-ui/core/IconButton";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";

import TextField from "common/TextField";
import ActivityIndicator from "common/ActivityIndicator";
import MultipleSelection from "common/MultipleSelection";

import * as usersService from "core/usersService";
import { MenuItem } from "@material-ui/core";

const styles = (theme) => ({
  flatButton: {
    margin: theme.spacing.unit,
  },
  title: {
    padding: theme.spacing.unit * 2,
  },
  table: {
    padding: theme.spacing.unit * 2,
  },
  cell: {
    textAlign: "right",
  },
});

const EMPTY_USER = {
  _id: "",
  username: "",
  isAdmin: false,
  firstName: "",
  lastName: "",
  idNumber: "",
  address: "",
  phone: "",
  email: "",
  startDate: "",

  type: "employee",
  lastReportDay: 10,

  defaultHourlyQuote: 0,
  defaultTravelQuote: 0,

  activities: [],
};

class User extends React.PureComponent {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    userId: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["new"])])
      .isRequired,
    clients: PropTypes.array.isRequired,
    onUpdate: PropTypes.func.isRequired,
  };

  state = {
    loading: true,
    saving: false,
    user: null,
    hasChanges: false,
    errorFields: [],
    selectedClients: [],
    initialActivities: [],
  };

  constructor(props) {
    super(props);
    if (props.userId === "new") {
      const user = {
        ...EMPTY_USER,
        activities: [], // No activities initially
      };

      this.state = {
        ...this.state,
        loading: false,
        selectedClients: [], // Empty array for new users
        user,
        initialActivities: user.activities, // Set initial activities
      };
    } else {
      this.fetchUser(props.userId);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.userId !== this.props.userId) {
      if (nextProps.userId === "new") {
        // Clear state for a new user
        this.setState({
          loading: false,
          saving: false,
          errorFields: [],
          selectedClients: [], // Ensure selectedClients is empty
          hasChanges: false,
          user: {
            ...EMPTY_USER,
            activities: [], // Ensure activities is empty
          },
          initialActivities: [], // Ensure initialActivities is empty
        });
      } else {
        // Load existing user
        this.setState({
          loading: true,
          saving: false,
          errorFields: [],
          hasChanges: false,
          user: null,
        });
        this.fetchUser(nextProps.userId);
      }
    }
  }

  componentWillUnmount() {
    this._umounted = true;
  }

  async fetchUser(userId) {
    const user = await usersService.getUserById(userId);

    const selectedClients = uniq((user.activities || []).map((a) => a.clientId))
      .map((clientId) => this.props.clients.find(({ _id }) => _id === clientId))
      .filter(Boolean);
    this.setState({
      loading: false,
      hasChanges: false,
      user: {
        ...EMPTY_USER,
        ...user,
      },
      selectedClients,
      initialActivities: user.activities, // Set initial activities after fetching user
    });
  }

  setValue(key, value) {
    if (this._umounted) {
      return;
    }

    this.setState({
      hasChanges: true,
      user: {
        ...this.state.user,
        [key]: value,
      },
    });

    if (this.state.errorFields.includes(key)) {
      this.setState({
        errorFields: this.state.errorFields.filter((field) => field !== key),
      });
    }
  }

  updateActivities(e) {
    this.setValue(
      "activities",
      e.target.value.map(
        (id) =>
          this.state.user.activities.find(
            ({ activityId }) => activityId === id
          ) || {
            activityId: id,
            hourlyQuote: "",
          }
      )
    );

    if (
      this.state.errorFields.find((errField) =>
        errField.startsWith("activities")
      )
    ) {
      this.setState({
        errorFields: this.state.errorFields.filter(
          (field) => !field.startsWith("activities")
        ),
      });
    }
  }

  updateSelectedClients(selectedClients = []) {
    const { user, initialActivities } = this.state;

    const filteredActivities = user.activities.filter(({ clientId }) =>
      selectedClients.some((client) => client._id === clientId)
    );

    const hasChanges =
      filteredActivities.length !== initialActivities.length ||
      filteredActivities.some(
        (activity, index) =>
          initialActivities[index] &&
          (activity.clientId !== initialActivities[index].clientId ||
            activity.activityId !== initialActivities[index].activityId)
      );

    this.setState(
      {
        selectedClients,
        user: {
          ...user,
          activities: filteredActivities,
        },
        hasChanges,
      },
      () => {
        console.log("Updated State:", this.state);
      }
    );
  }

  updateActivityField(activityId, clientId, key, val) {
    const { activities } = this.state.user;
    const idx = activities.findIndex(
      (a) => a.activityId === activityId && a.clientId === clientId
    );
    if (idx === -1) {
      return;
    }
    this.setValue("activities", [
      ...activities.slice(0, idx),
      {
        ...activities[idx],
        [key]: val,
      },
      ...activities.slice(idx + 1),
    ]);

    const errKey = `activities.${idx}.${key}`;
    if (this.state.errorFields.includes(errKey)) {
      this.setState({
        errorFields: this.state.errorFields.filter((field) => field !== errKey),
      });
    }
  }

  handleActivityCheckbox(clientId, activityId, checked) {
    if (checked) {
      this.setValue("activities", [
        ...this.state.user.activities,
        {
          clientId,
          activityId,
        },
      ]);
    } else {
      this.setValue(
        "activities",
        this.state.user.activities.filter(
          (activity) =>
            !(
              activity.clientId === clientId &&
              activity.activityId === activityId
            )
        )
      );
    }
  }

  selectAllActivities() {
    const { clients } = this.props;
    const {
      user: { activities },
    } = this.state;
    this.setState({
      selectedClients: clients,
    });

    this.setValue(
      "activities",
      clients.reduce((ret, { _id, activities }) => {
        activities &&
          activities.forEach(({ activityId }) => {
            if (
              !ret.some(
                (x) => x.clientId === _id && x.activityId === activityId
              )
            ) {
              ret.push({
                clientId: _id,
                activityId,
              });
            }
          });
        return ret;
      }, activities || [])
    );
  }

  async resetPassword() {
    this.setState({ saving: true });
    const { _id } = this.state.user;
    try {
      await usersService.resetPassword(_id);
    } catch (e) {
      console.log(e);
    }

    this.setState({ saving: false });
  }

  async save() {
    this.setState({
      saving: true,
      errorFields: [],
    });
    const { _id, ...settings } = this.state.user;
    try {
      const user = _id
        ? await usersService.updateUser(_id, settings)
        : await usersService.addUser(settings);

      this.setState({
        user: {
          ...EMPTY_USER,
          ...user,
        },
        hasChanges: false,
        errorFields: [],
        saving: false,
        initialActivities: user.activities, // Update initial activities after saving
      });
      this.props.onUpdate(user);
    } catch (err) {
      this.setState({
        saving: false,
      });
      const fields = get(err, "response.data.fields");
      if (fields) {
        this.setState({
          errorFields: Object.keys(fields),
        });
      }
    }
  }

  async delete() {
    if (!confirm("האם אתה בטוח שברצונך למחוק את העובד?")) {
      return;
    }

    this.setState({
      saving: true,
    });
    const { userId } = this.props;
    await usersService.deleteUser(userId);
    this.setState({
      hasChanges: false,
    });
    this.props.onDelete(userId);
  }

  render() {
    const { classes, clients } = this.props;
    const { loading, user, hasChanges, saving, errorFields, selectedClients } =
      this.state;

    if (loading) {
      return <ActivityIndicator />;
    }

    return (
      <React.Fragment>
        <Prompt
          when={hasChanges}
          message="שינויים לא נשמרו, האם לעזוב את הדף?"
        />
        <Grid container direction="column">
          <Grid container justify="space-between">
            <Grid item>
              <Typography className={classes.title} variant="title">
                פרטי עובד
              </Typography>
            </Grid>
            <Grid item>
              {saving && <ActivityIndicator />}
              {!saving && hasChanges && (
                <IconButton onClick={this.save}>
                  <SaveIcon />
                </IconButton>
              )}
              {!saving && user._id && (
                <IconButton onClick={this.delete}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3}>
              <TextField
                label="מספר עובד"
                value={user._id}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="ת.ז."
                value={user.idNumber || ""}
                onChange={(e) => this.setValue("idNumber", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("idNumber")}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                type="date"
                label="תאריך תחילת עבודה"
                value={getFormattedDate(user.startDate)}
                onChange={(e) => this.setValue("startDate", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("startDate")}
              />
            </Grid>
            <Grid item xs={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={user.isAdmin}
                    onChange={(e, checked) => this.setValue("isAdmin", checked)}
                    disabled={saving}
                  />
                }
                label="מנהל"
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3}>
              <TextField
                label="שם פרטי"
                value={user.firstName || ""}
                onChange={(e) => this.setValue("firstName", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("firstName")}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="שם משפחה"
                value={user.lastName || ""}
                onChange={(e) => this.setValue("lastName", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("lastName")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="טלפון"
                value={user.phone || ""}
                onChange={(e) => this.setValue("phone", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("phone")}
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={6}>
              <TextField
                label="כתובת"
                value={user.address || ""}
                onChange={(e) => this.setValue("address", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("address")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="email"
                value={user.email || ""}
                onChange={(e) => this.setValue("email", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("email")}
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={6}>
              <TextField
                label="שם משתמש"
                value={user.username || ""}
                onChange={(e) => this.setValue("username", e.target.value)}
                fullWidth
                disabled={saving}
                error={errorFields.includes("username")}
              />
            </Grid>
            <Grid item xs={6}>
              {user._id && (
                <Button
                  color="primary"
                  variant="contained"
                  disabled={saving}
                  onClick={this.resetPassword}
                >
                  איפוס סיסמא
                </Button>
              )}
            </Grid>
          </Grid>
          <Grid item>
            <Typography className={classes.title} variant="title">
              שכר
            </Typography>
          </Grid>
          <Grid container>
            <Grid item xs={2}>
              <TextField
                label="סוג עובד"
                fullWidth
                select
                value={user.type || ""}
                onChange={(e) => this.setValue("type", e.target.value)}
                disabled={saving}
                error={errorFields.includes("type")}
              >
                <MenuItem value="employee">שכיר</MenuItem>
                <MenuItem value="contractor">עצמאי</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="תעריף שעתי"
                fullWidth
                type="number"
                value={user.defaultHourlyQuote || ""}
                onChange={(e) =>
                  this.setValue("defaultHourlyQuote", e.target.value)
                }
                disabled={saving}
                error={errorFields.includes("defaultHourlyQuote")}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="תעריף נסיעות"
                fullWidth
                type="number"
                value={user.defaultTravelQuote || ""}
                onChange={(e) =>
                  this.setValue("defaultTravelQuote", e.target.value)
                }
                disabled={saving}
                error={errorFields.includes("defaultTravelQuote")}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="יום אחרון לדיווח"
                fullWidth
                type="number"
                min={0}
                max={31}
                value={user.lastReportDay || ""}
                onChange={(e) => this.setValue("lastReportDay", e.target.value)}
                disabled={saving}
                error={errorFields.includes("lastReportDay")}
              />
            </Grid>
          </Grid>
          <Grid item>
            <Typography className={classes.title} variant="title">
              פעילויות
            </Typography>
          </Grid>
          <Grid container>
            <Grid item xs={11}>
              <MultipleSelection
                label="לקוחות"
                disabled={saving}
                value={selectedClients}
                onChange={this.updateSelectedClients}
                data={clients}
                displayField="name"
              />
            </Grid>
            <Grid item xs={1}>
              <Button
                color="primary"
                className={classes.flatButton}
                disabled={saving}
                onClick={this.selectAllActivities}
              >
                סמן הכל
              </Button>
            </Grid>
          </Grid>
          <Grid item>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell className={classes.cell}>בית ספר</TableCell>
                  <TableCell className={classes.cell}>פעילות</TableCell>
                  <TableCell className={classes.cell}>שיוך</TableCell>
                  <TableCell className={classes.cell}>תעריף שעתי</TableCell>
                  <TableCell className={classes.cell}>תעריף נסיעות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedClients.map((client) => (
                  <React.Fragment key={client._id}>
                    {client.activities.map((activity, clientIdx) => {
                      const idx = user.activities.findIndex(
                        ({ activityId, clientId }) =>
                          activityId === activity.activityId &&
                          clientId === client._id
                      );
                      const userActivity = user.activities[idx];
                      return (
                        <TableRow key={activity.activityId}>
                          <TableCell className={classes.cell}>
                            {clientIdx === 0 ? client.name : ""}
                          </TableCell>
                          <TableCell className={classes.cell}>
                            {activity.name}
                          </TableCell>
                          <TableCell className={classes.cell}>
                            <Checkbox
                              checked={!!userActivity}
                              onChange={(e, checked) =>
                                this.handleActivityCheckbox(
                                  client._id,
                                  activity.activityId,
                                  checked
                                )
                              }
                              disabled={saving}
                            />
                          </TableCell>
                          <TableCell className={classes.cell}>
                            {userActivity && (
                              <TextField
                                type="number"
                                fullWidth
                                value={userActivity.hourlyQuote || ""}
                                placeholder={`${user.defaultHourlyQuote || ""}`}
                                onChange={(e) =>
                                  this.updateActivityField(
                                    activity.activityId,
                                    client._id,
                                    "hourlyQuote",
                                    e.target.value
                                  )
                                }
                                disabled={saving}
                                error={errorFields.includes(
                                  `activities.${idx}.hourlyQuote`
                                )}
                              />
                            )}
                          </TableCell>
                          <TableCell className={classes.cell}>
                            {userActivity && (
                              <TextField
                                type="number"
                                fullWidth
                                value={userActivity.travelQuote || ""}
                                placeholder={`${user.defaultTravelQuote || ""}`}
                                onChange={(e) =>
                                  this.updateActivityField(
                                    activity.activityId,
                                    client._id,
                                    "travelQuote",
                                    e.target.value
                                  )
                                }
                                disabled={saving}
                                error={errorFields.includes(
                                  `activities.${idx}.travelQuote`
                                )}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

const getFormattedDate = (date) => {
  if (!date) {
    return "";
  }
  const d = new Date(date);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  return `${d.getUTCFullYear()}-${month < 10 ? `0${month}` : month}-${
    day < 10 ? `0${day}` : day
  }`;
};

export default withStyles(styles)(User);
