import React, { Component } from 'react';
import { Navigate } from 'react-router-dom'; // Replaced Redirect with Navigate
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ErrorMessage from 'common/ErrorMessage';
import Typography from '@mui/material/Typography';
import { changePassword } from 'core/authService';
import withStyles from '@mui/styles/withStyles';
import TextField from 'common/TextField';
import ActivityIndicator from 'common/ActivityIndicator';

const styles = (theme) => ({
  root: {
    width: 300,
    margin: 'auto',
    marginTop: theme.spacing(5),
  },
  form: {
    display: 'flex',
    gap: 5,
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(2),
  },
});

class LoginForm extends Component {
  state = {
    oldPassword: '',
    newPassword: '',
    working: false,
    oldPasswordError: '',
    newPasswordError: '',
    error: '',
    passwordChanged: false,
  };

  async changePassword(e) {
    e.preventDefault();
    e.stopPropagation();

    const { oldPassword, newPassword } = this.state;
    this.setState({
      error: '',
      oldPasswordError: '',
      newPasswordError: '',
      working: true,
    });
    try {
      await changePassword(oldPassword, newPassword);
      this.setState({
        passwordChanged: true,
      });
    } catch (error) {
      this.setState({
        working: false,
        error: error.message,
      });
    }
  }

  setOldPassword = (event) => {
    const oldPassword = event.target.value;
    this.setState({ oldPassword });
    if (!oldPassword) {
      this.setState({ oldPasswordError: 'שדה חובה!' });
    } else {
      this.setState({ oldPasswordError: '' });
    }
  };

  setNewPassword = (event) => {
    const newPassword = event.target.value;
    this.setState({ newPassword });
    if (!newPassword) {
      this.setState({ newPasswordError: 'שדה חובה!' });
    } else {
      this.setState({ newPasswordError: '' });
    }
  };

  render() {
    const {
      oldPassword,
      newPassword,
      oldPasswordError,
      newPasswordError,
      working,
      error,
      passwordChanged,
    } = this.state;

    const { classes } = this.props;

    if (passwordChanged) {
      return <Navigate to="/" replace />; // Use Navigate for redirection
    }

    return (
      <Paper className={classes.root}>
        <form
          className={classes.form}
          onSubmit={(e) => this.changePassword(e)}
        >
          <Typography variant="h6">שינוי סיסמא</Typography>
          <TextField
            name="oldPassword"
            label="סיסמא ישנה"
            type="password"
            value={oldPassword}
            onChange={this.setOldPassword}
            error={!!oldPasswordError}
            fullWidth
            disabled={working}
          />
          <TextField
            name="newPassword"
            label="סיסמא חדשה"
            type="password"
            value={newPassword}
            onChange={this.setNewPassword}
            error={!!newPasswordError}
            fullWidth
            disabled={working}
          />
          <ErrorMessage>{error}</ErrorMessage>
          {working ? (
            <ActivityIndicator />
          ) : (
            <Button
              color="primary"
              variant="contained"
              type="submit"
              disabled={!(oldPassword && newPassword)}
            >
              שנה סיסמא
            </Button>
          )}
        </form>
      </Paper>
    );
  }
}

export default withStyles(styles)(LoginForm);
