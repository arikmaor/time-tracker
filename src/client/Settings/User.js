import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { get, uniq } from "lodash";
import Grid from "@mui/material/Grid";
import withStyles from "@mui/styles/withStyles";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";

import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

import TextField from "common/TextField";
import ActivityIndicator from "common/ActivityIndicator";
import MultipleSelection from "common/MultipleSelection";

import * as usersService from "core/usersService";
import { MenuItem } from "@mui/material";

const styles = (theme) => ({
  flatButton: {
    margin: theme.spacing(1),
  },
  title: {
    padding: theme.spacing(2),
  },
  table: {
    padding: theme.spacing(2),
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

const User = ({ classes, userId, clients, onUpdate }) => {
  const [state, setState] = React.useState({
    loading: true,
    saving: false,
    user: null,
    hasChanges: false,
    errorFields: [],
    selectedClients: [],
    initialActivities: [],
  });

  const navigate = useNavigate();

  const setValue = (key, value) => {
    setState((prevState) => ({
      ...prevState,
      hasChanges: true,
      user: {
        ...prevState.user,
        [key]: value,
      },
    }));
  };

  const blockNavigation = (shouldBlock) => {
    window.onbeforeunload = shouldBlock ? () => true : null;
  };

  useEffect(() => {
    blockNavigation(state.hasChanges);
    return () => blockNavigation(false);
  }, [state.hasChanges]);

  useEffect(() => {
    if (userId === "new") {
      const user = {
        ...EMPTY_USER,
        activities: [],
      };
      setState((prevState) => ({
        ...prevState,
        loading: false,
        user,
        initialActivities: user.activities,
      }));
    } else {
      fetchUser(userId);
    }
  }, [userId]);

  const fetchUser = async (id) => {
    const user = await usersService.getUserById(id);
    const selectedClients = uniq((user.activities || []).map((a) => a.clientId))
      .map((clientId) => clients.find(({ _id }) => _id === clientId))
      .filter(Boolean);
    setState((prevState) => ({
      ...prevState,
      loading: false,
      hasChanges: false,
      user: { ...EMPTY_USER, ...user },
      selectedClients,
      initialActivities: user.activities,
    }));
  };

  const save = async () => {
    setState((prevState) => ({ ...prevState, saving: true }));
    const { _id, ...settings } = state.user;
    try {
      const user = _id
        ? await usersService.updateUser(_id, settings)
        : await usersService.addUser(settings);

      setState((prevState) => ({
        ...prevState,
        user: { ...EMPTY_USER, ...user },
        hasChanges: false,
        saving: false,
        initialActivities: user.activities,
      }));
      onUpdate(user);
    } catch (err) {
      const fields = get(err, "response.data.fields", []);
      setState((prevState) => ({
        ...prevState,
        saving: false,
        errorFields: Object.keys(fields),
      }));
    }
  };

  const resetPassword = async () => {
    setState((prevState) => ({ ...prevState, saving: true }));
    const { _id } = state.user;
    try {
      await usersService.resetPassword(_id);
    } catch (e) {
      console.log(e);
    }
    setState((prevState) => ({ ...prevState, saving: false }));
  };

  const selectAllActivities = () => {
    const updatedActivities = clients.flatMap(({ _id, activities }) =>
      activities.map(({ activityId }) => ({ clientId: _id, activityId }))
    );
    setState((prevState) => ({
      ...prevState,
      selectedClients: clients,
      user: {
        ...prevState.user,
        activities: updatedActivities,
      },
      hasChanges: true,
    }));
  };

  if (state.loading) {
    return <ActivityIndicator />;
  }

  return (
    <Grid container direction="column" padding={1} gap={1}>
      <Grid container justifyContent="space-between">
        <Grid item>
          <Typography className={classes.title} variant="h6">
            פרטי עובד
          </Typography>
        </Grid>
        <Grid item>
          {state.saving && <ActivityIndicator />}
          {!state.saving && state.hasChanges && (
            <IconButton onClick={save}>
              <SaveIcon />
            </IconButton>
          )}
          {!state.saving && state.user._id && (
            <IconButton onClick={() => navigate("/users")}>
              <DeleteIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      <Grid container gap={1}>
        <Grid item xs={1}>
          <TextField label="מספר עובד" value={state.user._id} fullWidth disabled />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="ת.ז."
            value={state.user.idNumber || ""}
            onChange={(e) => setValue("idNumber", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("idNumber")}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            type="date"
            label="תאריך תחילת עבודה"
            value={state.user.startDate || ""}
            onChange={(e) => setValue("startDate", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("startDate")}
          />
        </Grid>
        <Grid item xs={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={state.user.isAdmin}
                onChange={(e, checked) => setValue("isAdmin", checked)}
                disabled={state.saving}
              />
            }
            label="מנהל"
          />
        </Grid>
      </Grid>
      <Grid container gap={1}>
        <Grid item xs={3}>
          <TextField
            label="שם פרטי"
            value={state.user.firstName || ""}
            onChange={(e) => setValue("firstName", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("firstName")}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="שם משפחה"
            value={state.user.lastName || ""}
            onChange={(e) => setValue("lastName", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("lastName")}
          />
        </Grid>
        <Grid item xs={5}>
          <TextField
            label="טלפון"
            value={state.user.phone || ""}
            onChange={(e) => setValue("phone", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("phone")}
          />
        </Grid>
      </Grid>
      <Grid container gap={1}>
        <Grid item xs={5}>
          <TextField
            label="כתובת"
            value={state.user.address || ""}
            onChange={(e) => setValue("address", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("address")}
          />
        </Grid>
        <Grid item xs={5}>
          <TextField
            label="email"
            value={state.user.email || ""}
            onChange={(e) => setValue("email", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("email")}
          />
        </Grid>
      </Grid>
      <Grid container gap={1}>
        <Grid item xs={6}>
          <TextField
            label="שם משתמש"
            value={state.user.username || ""}
            onChange={(e) => setValue("username", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("username")}
          />
        </Grid>
        <Grid item xs={6}>
          {state.user._id && (
            <Button
              color="primary"
              variant="contained"
              disabled={state.saving}
              onClick={resetPassword}
            >
              איפוס סיסמא
            </Button>
          )}
        </Grid>
      </Grid>
      <Grid item>
        <Typography className={classes.title} variant="h6">
          שכר
        </Typography>
      </Grid>
      <Grid container gap={1}>
        <Grid item xs={2}>
          <TextField
            label="סוג עובד"
            fullWidth
            select
            value={state.user.type || ""}
            onChange={(e) => setValue("type", e.target.value)}
            disabled={state.saving}
            error={state.errorFields.includes("type")}
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
            value={state.user.defaultHourlyQuote || ""}
            onChange={(e) => setValue("defaultHourlyQuote", e.target.value)}
            disabled={state.saving}
            error={state.errorFields.includes("defaultHourlyQuote")}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            label="תעריף נסיעות"
            fullWidth
            type="number"
            value={state.user.defaultTravelQuote || ""}
            onChange={(e) => setValue("defaultTravelQuote", e.target.value)}
            disabled={state.saving}
            error={state.errorFields.includes("defaultTravelQuote")}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            label="יום אחרון לדיווח"
            fullWidth
            type="number"
            min={0}
            max={31}
            value={state.user.lastReportDay || ""}
            onChange={(e) => setValue("lastReportDay", e.target.value)}
            disabled={state.saving}
            error={state.errorFields.includes("lastReportDay")}
          />
        </Grid>
      </Grid>
      <Grid container item>
        <Typography className={classes.title} variant="h6">
          פעילויות
        </Typography>
        <Button
          color="primary"
          className={classes.flatButton}
          disabled={state.saving}
          onClick={selectAllActivities}
        >
          סמן הכל
        </Button>
      </Grid>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item>
          <MultipleSelection
            label="לקוחות"
            disabled={state.saving}
            value={state.selectedClients}
            onChange={(value) => {
              const selectedClients = value;
              const filteredActivities = state.user.activities.filter(({ clientId }) =>
                selectedClients.some((client) => client._id === clientId)
              );
              setState((prevState) => ({
                ...prevState,
                selectedClients,
                user: {
                  ...prevState.user,
                  activities: filteredActivities,
                },
                hasChanges: true,
              }));
            }}
            data={clients}
            displayField="name"
          />
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
            {state.selectedClients.map((client) => (
              <React.Fragment key={client._id}>
                {client.activities.map((activity) => {
                  const idx = state.user.activities.findIndex(
                    ({ activityId, clientId }) =>
                      activityId === activity.activityId && clientId === client._id
                  );
                  const userActivity = state.user.activities[idx];
                  return (
                    <TableRow key={activity.activityId}>
                      <TableCell className={classes.cell}>{client.name}</TableCell>
                      <TableCell className={classes.cell}>{activity.name}</TableCell>
                      <TableCell className={classes.cell}>
                        <Checkbox
                          checked={!!userActivity}
                          onChange={(e, checked) => {
                            const updatedActivities = checked
                              ? [
                                  ...state.user.activities,
                                  { clientId: client._id, activityId: activity.activityId },
                                ]
                              : state.user.activities.filter(
                                  (a) =>
                                    !(a.clientId === client._id && a.activityId === activity.activityId)
                                );
                            setState((prevState) => ({
                              ...prevState,
                              user: {
                                ...prevState.user,
                                activities: updatedActivities,
                              },
                              hasChanges: true,
                            }));
                          }}
                          disabled={state.saving}
                        />
                      </TableCell>
                      <TableCell className={classes.cell}>
                        {userActivity && (
                          <TextField
                            type="number"
                            fullWidth
                            value={userActivity.hourlyQuote || ""}
                            placeholder={`${state.user.defaultHourlyQuote || ""}`}
                            onChange={(e) => {
                              const updatedActivities = [...state.user.activities];
                              updatedActivities[idx] = {
                                ...updatedActivities[idx],
                                hourlyQuote: e.target.value,
                              };
                              setState((prevState) => ({
                                ...prevState,
                                user: {
                                  ...prevState.user,
                                  activities: updatedActivities,
                                },
                                hasChanges: true,
                              }));
                            }}
                            disabled={state.saving}
                            error={state.errorFields.includes(
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
                            placeholder={`${state.user.defaultTravelQuote || ""}`}
                            onChange={(e) => {
                              const updatedActivities = [...state.user.activities];
                              updatedActivities[idx] = {
                                ...updatedActivities[idx],
                                travelQuote: e.target.value,
                              };
                              setState((prevState) => ({
                                ...prevState,
                                user: {
                                  ...prevState.user,
                                  activities: updatedActivities,
                                },
                                hasChanges: true,
                              }));
                            }}
                            disabled={state.saving}
                            error={state.errorFields.includes(
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
  );
};

User.propTypes = {
  classes: PropTypes.object.isRequired,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["new"])]).isRequired,
  clients: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default withStyles(styles)(User);