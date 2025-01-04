import React, { Component } from "react";
import { Navigate } from "react-router-dom"; // Use Navigate instead of Redirect
import { get } from "lodash";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import withStyles from "@mui/styles/withStyles";
import ErrorMessage from "common/ErrorMessage";
import { signIn, getSignedInUser } from "core/authService";
import TextField from "common/TextField";
import ActivityIndicator from "common/ActivityIndicator";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const styles = (theme) => ({
  root: {
    width: 300,
    margin: "auto",
    marginTop: theme.spacing(5),
  },
  form: {
    display: "flex",
    gap: 5,
    flexDirection: "column",
    alignItems: "center",
    padding: theme.spacing(2),
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
    showPassword: false,
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
      const redirectTo = get(location, "state.from", "/");
      return <Navigate to={redirectTo} replace />; // Use Navigate for redirection
    }

    return (
      <Paper className={classes.root}>
        <form className={classes.form} onSubmit={(e) => this.performLogin(e)}>
          <Typography variant="h6">שמיר יעוץ והדרכה</Typography>
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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={this.setPassword}
            error={!!passwordError}
            fullWidth={true}
            disabled={authenticating}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={this.togglePasswordVisibility}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
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
