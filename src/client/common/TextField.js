import React from 'react'
import TextField from '@material-ui/core/TextField';
import withStyles from '@material-ui/core/styles/withStyles';

const styles = theme => ({
  textField: {
    padding: theme.spacing.unit * 2,
  },
  label: {
    left: 'unset',
    direction: 'rtl',
    transformOrigin: 'top right'
  },
  input: {
    marginTop: 'unset !important'
  },
})

const RtlTextField = ({classes, ...rest}) => (
  <TextField
    className={classes.textField}
    InputLabelProps={{
      className: classes.label,
    }}
    InputProps={{
      className: classes.input,
    }}
    {...rest}
  />
)

export default withStyles(styles)(RtlTextField)
