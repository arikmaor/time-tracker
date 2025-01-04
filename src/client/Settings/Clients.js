import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import withStyles from "@mui/styles/withStyles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

import TextField from "common/TextField";
import ActivityIndicator from "common/ActivityIndicator";
import Client from "./Client";

import * as clientsService from "core/clientsService";
import * as activitiesService from "core/activitiesService";

const styles = (theme) => ({
  listItemText: {
    textAlign: "right",
  },
  buttonsRow: {
    textAlign: "left",
  },
});

const Clients = ({ classes }) => {
  const { clientId } = useParams(); // Get clientId from the URL
  const navigate = useNavigate(); // Navigate programmatically

  const [state, setState] = useState({
    loading: true,
    clients: [],
    filter: "",
    activities: [],
    selectedClientId: null,
  });

  useEffect(() => {
    const init = async () => {
      const [clients, activities] = await Promise.all([
        clientsService.getAllClients(),
        activitiesService.getAllActivities(),
      ]);
      setState((prevState) => ({
        ...prevState,
        loading: false,
        clients,
        activities,
      }));
    };
    init();
  }, []);

  const setFilter = (e) => {
    setState((prevState) => ({
      ...prevState,
      filter: e.target.value,
    }));
  };

  const selectClient = (client) => {
    navigate(`/clients/${client._id}`); // Use navigate instead of this.props.history
  };

  const addNewClient = () => {
    navigate(`/clients/new`);
  };

  const onUpdate = (client) => {
    const idx = state.clients.findIndex(({ _id }) => _id === client._id);
    if (idx === -1) {
      setState((prevState) => ({
        ...prevState,
        clients: [client, ...prevState.clients],
      }));
      navigate(`/clients/${client._id}`);
    } else {
      setState((prevState) => ({
        ...prevState,
        clients: [
          ...prevState.clients.slice(0, idx),
          client,
          ...prevState.clients.slice(idx + 1),
        ],
      }));
    }
  };

  const onDelete = (clientId) => {
    setState((prevState) => ({
      ...prevState,
      clients: prevState.clients.filter(({ _id }) => _id !== clientId),
    }));
    navigate(`/clients`);
  };

  const { loading, clients, filter, activities } = state;
  const selectedClientId = Number(clientId) || clientId;

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <Grid padding={1} container spacing={3}>
      <Grid item xs={4}>
        <TextField
          label="חיפוש"
          fullWidth={true}
          onChange={setFilter}
          value={filter}
        />
        <Paper>
          <List>
            {clients
              .filter(({ name }) => name.includes(filter))
              .map((client) => (
                <ListItem
                  key={client._id}
                  button
                  selected={client._id === selectedClientId}
                  onClick={() => selectClient(client)}
                >
                  <ListItemText
                    className={classes.listItemText}
                    primary={client.name}
                  />
                </ListItem>
              ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={8}>
        <Grid container spacing={3} direction="column">
          <Grid item className={classes.buttonsRow}>
            <Button onClick={addNewClient} variant="contained" color="primary">
              <AddIcon className={classes.newIcon} />
              לקוח חדש
            </Button>
          </Grid>
          <Grid item>
            {selectedClientId && (
              <Paper>
                <Client
                  clientId={selectedClientId}
                  activities={activities}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </Paper>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

Clients.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Clients);
