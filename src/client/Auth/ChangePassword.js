import React, { Component } from 'react'
import {Redirect} from "react-router-dom"
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import ErrorMessage from 'common/ErrorMessage'
import Typography from '@material-ui/core/Typography';
import {changePassword} from 'core/authService'
import withStyles from '@material-ui/core/styles/withStyles';
import TextField from 'common/TextField';
import ActivityIndicator from 'common/ActivityIndicator';

const styles = theme => ({
  root: {
    width: 300,
    margin: 'auto',
    marginTop: theme.spacing.unit * 5
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing.unit * 2
  }
})

class LoginForm extends Component {
  state = {
    oldPassword: '',
    newPassword: '',
    working: false,
    oldPasswordError: '',
    newPasswordError: '',
    error: '',
    passwordChanged: false
  }

  async changePassword(e) {
    e.preventDefault()
    e.stopPropagation()

    const {oldPassword, newPassword} = this.state
    this.setState({
      error: '',
      oldPasswordError: '',
      newPasswordError: '',
      working: true,
    })
    try {
      await changePassword(oldPassword, newPassword)
      this.setState({
        passwordChanged: true
      })
    } catch (error) {
      this.setState({
        working: false,
        error: error.message
      })
    }
  }

  setOldPassword (event) {
    const oldPassword = event.target.value
    this.setState({oldPassword})
    if (!oldPassword) {
      this.setState({oldPasswordError: 'שדה חובה!'})
    } else {
      this.setState({oldPasswordError: ''})
    }
  }

  setNewPassword (event) {
    const newPassword = event.target.value
    this.setState({newPassword})
    if (!newPassword) {
      this.setState({newPasswordError: 'שדה חובה!'})
    } else {
      this.setState({newPasswordError: ''})
    }
  }

  render() {
    const {classes} = this.props
    const {oldPassword, newPassword, oldPasswordError, newPasswordError, working, error, passwordChanged} = this.state

    if (passwordChanged) {
      return <Redirect to={'/'} />
    }

    return (
      <Paper className={classes.root}>
        <form className={classes.form} onSubmit={this.changePassword}>
          <Typography variant='title'>
            שינוי סיסמא
          </Typography>
          <TextField
            name='oldPassword'
            label='סיסמא ישנה'
            type='password'
            value={oldPassword}
            onChange={this.setOldPassword}
            error={!!oldPasswordError}
            fullWidth={true}
            disabled={working}
          />
          <TextField
            name='newPassword'
            label='סיסמא חדשה'
            type='password'
            value={newPassword}
            onChange={this.setNewPassword}
            error={!!newPasswordError}
            fullWidth={true}
            disabled={working}
          />
          <ErrorMessage>{error}</ErrorMessage>
          {working ? <ActivityIndicator /> : (
            <Button color='primary' variant='contained' type='submit' disabled={!(oldPassword && newPassword)}>שנה סיסמא</Button>
          )}
        </form>
      </Paper>
    )
  }
}

export default withStyles(styles)(LoginForm)
