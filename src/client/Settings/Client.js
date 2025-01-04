import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import { get } from "lodash";
import Grid from "@mui/material/Grid";
import withStyles from "@mui/styles/withStyles";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

import TextField from "common/TextField";
import ActivityIndicator from "common/ActivityIndicator";
import MultipleSelection from "common/MultipleSelection";

import * as clientsService from "core/clientsService";

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

const EMPTY_CLIENT = {
  _id: "",
  name: "",
  contactPersonName: "",
  phone: "",
  address: "",
  email: "",
  notes: "",
  activities: [],
};

const Client = ({ classes, activities, onUpdate }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    saving: false,
    client: null,
    hasChanges: false,
    errorFields: [],
  });

  useEffect(() => {
    if (clientId === "new") {
      setState({
        ...state,
        loading: false,
        client: {
          ...EMPTY_CLIENT,
          activities: activities.map(({ _id }) => ({
            activityId: _id,
            hourlyQuote: "",
          })),
        },
      });
    } else {
      fetchClient(clientId);
    }
  }, [clientId]);

  const fetchClient = async (id) => {
    const client = await clientsService.getClientById(id);
    setState({
      ...state,
      loading: false,
      hasChanges: false,
      client: {
        ...EMPTY_CLIENT,
        ...client,
      },
    });
  };

  const setValue = (key, value) => {
    setState((prevState) => {
      const updatedErrorFields = Array.isArray(prevState.errorFields)
        ? prevState.errorFields.filter((field) => field !== key)
        : [];

      return {
        ...prevState,
        hasChanges: true,
        client: {
          ...prevState.client,
          [key]: value,
        },
        errorFields: updatedErrorFields,
      };
    });
  };
  

  const updateActivities = (selectedActivities) => {
    const updatedActivities = selectedActivities.map(({ _id }) =>
      state.client.activities.find(({ activityId }) => activityId === _id) || {
        activityId: _id,
      }
    );
    setValue("activities", updatedActivities);
  };

  const updateHourlyQuote = (id, hourlyQuote) => {
    const { activities } = state.client;
    const idx = activities.findIndex(({ activityId }) => activityId === id);
    if (idx !== -1) {
      const updatedActivities = [
        ...activities.slice(0, idx),
        { ...activities[idx], hourlyQuote },
        ...activities.slice(idx + 1),
      ];
      setValue("activities", updatedActivities);
    }
  };

  const save = async () => {
    setState({ ...state, saving: true, errorFields: [] });
    const { _id, ...settings } = state.client;
    try {
      const client = _id
        ? await clientsService.updateClient(_id, settings)
        : await clientsService.addClient(settings);

      setState({
        client: {
          ...EMPTY_CLIENT,
          ...client,
        },
        hasChanges: false,
        errorFields: [],
        saving: false,
      });
      onUpdate(client);
    } catch (err) {
      const fields = get(err, "response.data.fields");
      if (fields) {
        setState({
          ...state,
          saving: false,
          errorFields: Object.keys(fields),
        });
      }
    }
  };

  const deleteClient = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את הלקוח?")) {
      return;
    }
    setState({ ...state, saving: true });
    await clientsService.deleteClient(clientId);
    navigate("/clients");
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (state.hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state.hasChanges]);

  if (state.loading) {
    return <ActivityIndicator />;
  }

  return (
    <Grid container direction="column" padding={1} gap={1}>
      <Grid container justifyContent="space-between">
        <Grid item>
          <Typography className={classes.title} variant="h6">
            פרטי לקוח
          </Typography>
        </Grid>
        <Grid item>
          {state.saving && <ActivityIndicator />}
          {!state.saving && state.hasChanges && (
            <IconButton onClick={save}>
              <SaveIcon />
            </IconButton>
          )}
          {!state.saving && state.client._id && (
            <IconButton onClick={deleteClient}>
              <DeleteIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>

      <Grid container gap={1}>
        <Grid item xs={1.5}>
          <TextField
            label="מספר לקוח"
            value={state.client._id}
            fullWidth
            disabled
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="שם"
            value={state.client.name || ""}
            onChange={(e) => setValue("name", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("name")}
          />
        </Grid>
      </Grid>

      <Grid container gap={1}>
        <Grid item xs={5}>
          <TextField
            label="שם איש קשר"
            value={state.client.contactPersonName || ""}
            onChange={(e) => setValue("contactPersonName", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("contactPersonName")}
          />
        </Grid>
        <Grid item xs={5}>
          <TextField
            label="טלפון"
            value={state.client.phone || ""}
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
            value={state.client.address || ""}
            onChange={(e) => setValue("address", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("address")}
          />
        </Grid>
        <Grid item xs={5}>
          <TextField
            label="email"
            value={state.client.email || ""}
            onChange={(e) => setValue("email", e.target.value)}
            fullWidth
            disabled={state.saving}
            error={state.errorFields.includes("email")}
          />
        </Grid>
      </Grid>

      <Grid item>
        <TextField
          label="הערות"
          multiline
          value={state.client.notes || ""}
          onChange={(e) => setValue("notes", e.target.value)}
          fullWidth
          disabled={state.saving}
          error={state.errorFields.includes("notes")}
        />
      </Grid>

      <Grid item>
        <Typography className={classes.title} variant="h6">
          פעילויות
        </Typography>
      </Grid>

      <Grid container>
        <Grid item xs={11}>
          <MultipleSelection
            label="פעילויות"
            disabled={state.saving}
            value={state.client.activities.map(({ activityId }) =>
              activities.find(({ _id }) => _id === activityId)
            )}
            onChange={updateActivities}
            data={activities}
            displayField="name"
          />
        </Grid>
        <Grid item xs={1}>
          <Button
            color="primary"
            className={classes.flatButton}
            disabled={state.saving}
            onClick={() =>
              setValue(
                "activities",
                activities.map(({ _id }) => ({ activityId: _id, hourlyQuote: "" }))
              )
            }
          >
            סמן הכל
          </Button>
        </Grid>
      </Grid>

      <Grid item>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell className={classes.cell}>פעילות</TableCell>
              <TableCell className={classes.cell}>תעריף שעתי</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.client.activities.map(({ activityId, hourlyQuote }, idx) => {
              const activity = activities.find(({ _id }) => _id === activityId);
              if (!activity) {
                return null;
              }
              return (
                <TableRow key={activityId}>
                  <TableCell className={classes.cell}>{activity.name}</TableCell>
                  <TableCell className={classes.cell}>
                    <TextField
                      type="number"
                      min="0"
                      disabled={state.saving}
                      value={hourlyQuote || ""}
                      onChange={(e) =>
                        updateHourlyQuote(activityId, e.target.value)
                      }
                      error={state.errorFields.includes(
                        `activities.${idx}.hourlyQuote`
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Grid>
    </Grid>
  );
};

Client.propTypes = {
  classes: PropTypes.object.isRequired,
  activities: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default withStyles(styles)(Client);
