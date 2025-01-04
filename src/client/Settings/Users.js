import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { get } from 'lodash';
import Grid from '@mui/material/Grid';
import withStyles from '@mui/styles/withStyles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import TextField from 'common/TextField';
import ActivityIndicator from 'common/ActivityIndicator';

import User from './User';

import * as usersService from 'core/usersService';
import * as clientsService from 'core/clientsService';

const styles = (theme) => ({
  listItemText: {
    textAlign: 'right',
  },
  buttonsRow: {
    textAlign: 'left',
  },
});

class Users extends React.Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
  };

  state = {
    loading: true,
    clients: [],
    filter: '',
    selectedId: null,
  };

  constructor(props) {
    super(props);
    this.init();
    this.navigate = props.navigate; // Capture navigate function
  }

  async init() {
    const [clients, users] = await Promise.all([
      clientsService.getAllClients(),
      usersService.getAllUsers(),
    ]);
    this.setState({
      loading: false,
      clients,
      users,
    });
  }

  setFilter = (e) => {
    this.setState({
      filter: e.target.value,
    });
  };

  selectUser = (user) => {
    this.navigate(`/users/${user._id}`);
  };

  addNewUser = () => {
    this.navigate(`/users/new`);
  };

  onUpdate = (user) => {
    const idx = this.state.users.findIndex(({ _id }) => _id === user._id);
    if (idx === -1) {
      this.setState({
        users: [user, ...this.state.users],
      });
      this.navigate(`/users/${user._id}`);
    } else {
      this.setState({
        users: [
          ...this.state.users.slice(0, idx),
          user,
          ...this.state.users.slice(idx + 1),
        ],
      });
    }
  };

  onDelete = (userId) => {
    this.setState({
      users: this.state.users.filter(({ _id }) => _id !== userId),
    });
    this.navigate(`/users`);
  };

  render() {
    const { classes } = this.props;
    const { loading, users, clients, filter } = this.state;

    const userId = this.props.params.userId; // Use params from props
    const selectedId = Number(userId) || userId;

    if (loading) {
      return <ActivityIndicator />;
    }

    return (
      <Grid container spacing={3} padding={1}>
        <Grid item xs={4}>
          <TextField
            label="חיפוש"
            fullWidth={true}
            onChange={this.setFilter}
            value={filter}
          />
          <Paper>
            <List>
              {users
                .filter(({ displayName }) => displayName.includes(filter))
                .map((user) => (
                  <ListItem
                    key={user._id}
                    button
                    selected={user._id === selectedId}
                    onClick={() => this.selectUser(user)}
                  >
                    <ListItemText
                      className={classes.listItemText}
                      primary={`${user.firstName} ${user.lastName}`}
                    />
                  </ListItem>
                ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={8}>
          <Grid container spacing={3} direction="column">
            <Grid item className={classes.buttonsRow}>
              <Button
                onClick={this.addNewUser}
                variant="contained"
                color="primary"
              >
                <AddIcon className={classes.newIcon} />
                עובד חדש
              </Button>
            </Grid>
            <Grid item>
              {selectedId && (
                <Paper>
                  <User
                    userId={selectedId}
                    clients={clients}
                    onUpdate={this.onUpdate}
                    onDelete={this.onDelete}
                  />
                </Paper>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

// Wrap the component with withStyles and inject hooks
function withRouterAndNavigate(Component) {
  return (props) => {
    const navigate = useNavigate();
    const params = useParams();
    return <Component {...props} navigate={navigate} params={params} />;
  };
}

export default withRouterAndNavigate(withStyles(styles)(Users));
