import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { get } from "lodash";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import ErrorMessage from "common/ErrorMessage";
import Typography from "@material-ui/core/Typography";
import { signIn, getSignedInUser } from "core/authService";
import withStyles from "@material-ui/core/styles/withStyles";
import TextField from "common/TextField";
import ActivityIndicator from "common/ActivityIndicator";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";

const styles = (theme) => ({
  root: {
    width: 300,
    margin: "auto",
    marginTop: theme.spacing.unit * 5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.spacing.unit * 2,
  },
});

class LoginForm extends Component {
  state = {
    username: "",
    password: "",
    authenticating: false,
    usernameError: "",
    passwordError: "",
    error: "",
    user: null,
    showPassword: false, // Added to manage password visibility
  };

  constructor(props) {
    super(props);
    this.state.user = getSignedInUser();
  }

  async performLogin(e) {
    e.preventDefault();
    e.stopPropagation();

    const { username, password } = this.state;
    this.setState({
      error: "",
      usernameError: "",
      passwordError: "",
      authenticating: true,
    });
    try {
      const user = await signIn(username, password);
      this.setState({
        user,
      });
    } catch (error) {
      this.setState({
        authenticating: false,
        error: error.message,
      });
    }
  }

  setPassword = (event) => {
    const password = event.target.value;
    this.setState({ password });
    if (!password) {
      this.setState({ passwordError: "שדה חובה!" });
    } else {
      this.setState({ passwordError: "" });
    }
  };

  setUserName = (event) => {
    const username = event.target.value;
    this.setState({ username });
    if (!username) {
      this.setState({ usernameError: "שדה חובה!" });
    } else {
      this.setState({ usernameError: "" });
    }
  };

  togglePasswordVisibility = () => {
    this.setState({ showPassword: !this.state.showPassword });
  };

  render() {
    const { classes, location } = this.props;
    const {
      username,
      password,
      usernameError,
      passwordError,
      authenticating,
      error,
      user,
      showPassword,
    } = this.state;

    if (user) {
      return <Redirect to={get(location, "state.from", "/")} />;
    }

    return (
      <Paper className={classes.root}>
        <form className={classes.form} onSubmit={this.performLogin}>
          <Typography variant="title">שמיר יעוץ והדרכה</Typography>
          <TextField
            name="username"
            label="שם משתמש"
            value={username}
            onChange={this.setUserName}
            error={!!usernameError}
            fullWidth={true}
            disabled={authenticating}
          />
          <TextField
            name="password"
            label="סיסמא"
            type={this.state.showPassword ? "text" : "password"} // Toggle between text and password
            value={this.state.password}
            onChange={this.setPassword}
            error={!!this.state.passwordError}
            fullWidth={true}
            disabled={this.state.authenticating}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={this.togglePasswordVisibility}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus change on mousedown
                  >
                    {this.state.showPassword ? (
                      <Visibility />
                    ) : (
                      <VisibilityOff />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <ErrorMessage>{error}</ErrorMessage>
          {authenticating ? (
            <ActivityIndicator />
          ) : (
            <Button
              color="primary"
              variant="contained"
              type="submit"
              disabled={!(username && password)}
            >
              התחבר
            </Button>
          )}
        </form>
      </Paper>
    );
  }
}

export default withStyles(styles)(LoginForm);
