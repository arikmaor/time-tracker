import React from 'react'
import withStyles from '@mui/styles/withStyles';

const styles = {
  root: {
    color: 'red'
  }
}

const ErrorMessage = ({classes, children}) => (
  <div className={classes.root}>
    {children}
  </div>
)

export default withStyles(styles)(ErrorMessage)
