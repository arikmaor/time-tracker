import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { he as locale } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import TextField from '@mui/material/TextField';
import { withStyles } from '@mui/styles';

const styles = () => ({
  overlay: {
    position: 'absolute',
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 2,
  },
});

const parseDate = (str, formatStr, locale) => {
  const parsed = parse(str, formatStr, new Date(), { locale });
  return isNaN(parsed) ? undefined : parsed;
};

const formatDate = (date, formatStr, locale) =>
  format(date, formatStr, { locale });

const ForwardRefTextField = React.forwardRef((props, ref) => (
  <TextField {...props} inputRef={ref} />
));

const DayPickerComponent = React.forwardRef(
  ({ classes, error, value, onChange, ...rest }, ref) => {
    const handleDayChange = (day) => {
      if (onChange) {
        onChange(day);
      }
    };

    return (
      <div>
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleDayChange}
          locale={locale}
          {...rest}
        />
        <ForwardRefTextField
          value={value ? formatDate(value, 'dd/MM/yyyy', locale) : ''}
          onChange={(e) => {
            const parsedDate = parseDate(e.target.value, 'dd/MM/yyyy', locale);
            handleDayChange(parsedDate);
          }}
          error={error}
        />
      </div>
    );
  }
);

export default withStyles(styles)(DayPickerComponent);