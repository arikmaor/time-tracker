import React from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'
import {get} from 'lodash'
import Grid from '@material-ui/core/Grid'
import withStyles from '@material-ui/core/styles/withStyles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';

import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add'


import TextField from 'common/TextField'
import ActivityIndicator from 'common/ActivityIndicator'

import User from './User'

import * as usersService from 'core/usersService'
import * as clientsService from 'core/clientsService'

const styles = theme => ({
  listItemText: {
    textAlign: 'right'
  },
  buttonsRow: {
    textAlign: 'left'
  }
})

class Users extends React.Component {

  static propTypes = {
    classes: PropTypes.object.isRequired,
    match: PropTypes.object
  };

  state = {
    loading: true,
    clients: [],
    filter: '',
    selectedId: null
  }

  constructor(props) {
    super(props)
    this.init()
  }

  async init() {
    const [clients, users] = await Promise.all([
      clientsService.getAllClients(),
      usersService.getAllUsers()
    ])
    this.setState({
      loading: false,
      clients,
      users
    })
  }

  setFilter(e) {
    this.setState({
      filter: e.target.value
    })
  }

  selectUser(user) {
    this.props.history.push(`/users/${user._id}`)
  }

  addNewUser() {
    this.props.history.push(`/users/new`)
  }

  onUpdate(user) {
    const idx = this.state.users.findIndex(({_id}) => _id === user._id)
    if (idx === -1) {
      this.setState({
        users: [
          user,
          ...this.state.users
        ]
      })
      this.props.history.push(`/users/${user._id}`)
    } else {
      this.setState({
        users: [
          ...this.state.users.slice(0, idx),
          user,
          ...this.state.users.slice(idx+1)
        ]
      })
    }
  }

  onDelete(userId) {
    this.setState({
      users: this.state.users.filter(({_id}) => _id !== userId)
    })
    this.props.history.push(`/users`)
  }

  render() {
    const {classes, match} = this.props
    const {loading, users, clients, filter} = this.state

    const userId = get(match, 'params.userId')
    const selectedId = Number(userId) || userId

    if (loading) {
      return <ActivityIndicator />
    }

    return (
      <Grid container spacing={24}>
        <Grid item xs={4}>
          <TextField label='חיפוש' fullWidth={true} onChange={this.setFilter} value={filter}/>
          <Paper>
            <List>
              {users.filter(({displayName}) => displayName.includes(filter)).map(user => [
                <ListItem
                  key={user._id}
                  button
                  selected={user._id === selectedId}
                  onClick={() => this.selectUser(user)}
                >
                  <ListItemText className={classes.listItemText}
                  primary={`${user.firstName} ${user.lastName}`}
                />
                </ListItem>
              ])}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={8}>
          <Grid container spacing={24} direction='column'>
            <Grid item className={classes.buttonsRow}>
              <Button onClick={this.addNewUser} variant="contained" color="primary">
                <AddIcon className={classes.newIcon}/>
                עובד חדש
              </Button>
            </Grid>
            <Grid item>
              {selectedId && <Paper>
                <User
                  userId={selectedId}
                  clients={clients}
                  onUpdate={this.onUpdate}
                  onDelete={this.onDelete}
                />
              </Paper>}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    )
  }

}

export default withStyles(styles)(withRouter(Users))
