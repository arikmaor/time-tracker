import React from "react";
import PropTypes from "prop-types";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const theme = createTheme({
  typography: {
    fontSize: 12,
    fontFamily: '"Assistant", "Open Sans", serif',
  },
  palette: {
    primary: {
      main: "#1976d2", // Default MUI blue
    },
    secondary: {
      main: "#dc004e", // Default MUI pink
    },
    background: {
      default: "#f4f4f4", // Light gray background
    },
    text: {
      primary: "#333", // Dark text for better readability
    },
  },
});

const StylesProvider = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline /> {/* Ensures consistent global styles */}
    {children}
  </ThemeProvider>
);

StylesProvider.propTypes = {
  children: PropTypes.node.isRequired, // Ensures children are provided and valid
};

export { StylesProvider };
