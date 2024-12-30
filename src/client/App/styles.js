import React from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  typography: {
    fontSize: 12
  }
});

const StylesProvider = ({children}) => (
  <MuiThemeProvider theme={theme}>
    {children}
  </MuiThemeProvider>
)

export {StylesProvider}
