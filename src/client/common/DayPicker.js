import React from 'react'
import DayPickerInput from 'react-day-picker/DayPickerInput';
import MomentLocaleUtils from 'react-day-picker/moment';
import 'react-day-picker/lib/style.css';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';

import 'moment/locale/he'

const styles = theme => ({
  overlay: {
    position: 'absolute',
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 2
  }
})

const DAY_PICKER_PROPS = {
  locale: 'he',
  localeUtils: MomentLocaleUtils,
  canChangeMonth: false,
}

const ForwardRefTextField = React.forwardRef((props, ref) => (
  <TextField {...props} inputRef={ref} />
));

const DayPicker = React.forwardRef(({classes, error, ...rest}) => (
  <DayPickerInput
    dayPickerProps={DAY_PICKER_PROPS}
    inputProps={{
      error,
      inputProps: {
        readOnly: true
      }
    }}
    component={ForwardRefTextField}
    classNames={classes}
    {...rest}
  />
))

export default withStyles(styles)(DayPicker)
