import React from "react";
import { get } from "lodash";
import { Snackbar } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import apiClient from "core/apiClient";
import { signOut } from "core/authService";

// Use styled API for consistent theming
const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
  "& .MuiSnackbarContent-root": {
    marginTop: theme.spacing(1), // Use theme.spacing safely
    backgroundColor: theme.palette.error.dark,
  },
}));

class ErrorDisplay extends React.Component {
  state = {
    errorMessage: null,
  };

  constructor(props) {
    super(props);
    const { navigate } = props;
    apiClient.interceptors.response.use(
      null,
      (error) => {
        if (error.response.status === 401) {
          signOut();
          navigate("/login");
        } else {
          this.setState({
            errorMessage: get(
              error,
              "response.data.error",
              "unknown server error"
            ),
          });
        }
        return Promise.reject(error);
      }
    );
  }

  handleClose = () => {
    this.setState({ errorMessage: null });
  };

  render() {
    const { errorMessage } = this.state;

    return (
      <StyledSnackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        open={!!errorMessage}
        autoHideDuration={2000}
        onClose={this.handleClose}
        message={errorMessage}
      />
    );
  }
}

// Wrapper to inject `navigate` into props
const withNavigate = (Component) => (props) => {
  const navigate = useNavigate();
  return <Component {...props} navigate={navigate} />;
};

export default withNavigate(ErrorDisplay);
