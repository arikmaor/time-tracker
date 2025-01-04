import React, { use } from "react";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import CancelIcon from "@mui/icons-material/Cancel";
import { emphasize } from "@mui/system";
import Select from "react-select";

// Styles for the component
const useStyles = () => {
  const theme = useTheme();

  return {
    root: {
      flexGrow: 1,
      height: 250,
    },
    formControl: {
      // padding: TBD
    },
    input: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    valueContainer: {
      display: "flex",
      flexWrap: "wrap",
      flex: 1,
      alignItems: "center",
    },
    chip: {
      padding: '0 10px',
      margin: `${theme.spacing(0.5)} ${theme.spacing(0.5)}`,
    },
    chipFocused: {
      backgroundColor: emphasize(
        theme.palette.mode === "light"
          ? theme.palette.grey[300]
          : theme.palette.grey[700],
        0.08
      ),
    },
    deleteIcon: {
      margin: `${theme.spacing(0)} ${theme.spacing(0.5)}`,
    },
    noOptionsMessage: {
      padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
    },
    singleValue: {
      fontSize: 16,
    },
    placeholder: {
      position: "absolute",
      right: 10,
      fontSize: 16,
    },
    paper: {
      position: "absolute",
      zIndex: 1,
      marginTop: theme.spacing(1),
      left: 0,
      right: 0,
    },
    menuPortal: {
      zIndex: 9999, // Ensures the menu floats above other content
    },
    divider: {
      height: theme.spacing(2),
    },
    label: {
      left: "unset",
      direction: "rtl",
      transformOrigin: "top right",
    }
  }
};

// Custom components for react-select
function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      sx={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      אין אפשרויות
    </Typography>
  );
}

const InputComponent = ({ inputRef, ...props }) => {
  return <div ref={inputRef} {...props} />;
}

function Control(props) {
  const { selectProps, innerRef, children, innerProps } = props;

  return (
    <TextField
      fullWidth
      multiline
      InputProps={{
        inputComponent: InputComponent,
        inputProps: {
          sx: selectProps.classes.input,
          inputRef: innerRef,
          children,
          ...innerProps,
        },
      }}
      sx={selectProps.classes.formControl}
      {...selectProps.textFieldProps}
    />
  );
}

function Option(props) {
  const { innerRef, isFocused, isSelected, innerProps, children } = props;

  return (
    <MenuItem
      ref={innerRef} // Correctly using the ref prop
      selected={isFocused}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
      {...innerProps}
    >
      {children}
    </MenuItem>
  );
}

function Placeholder (props) {
  return (
    <Typography
      color="textSecondary"
      sx={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  )
};

function SingleValue (props) {
  return (
    <Typography
      sx={props.selectProps.classes.singleValue}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  )
};

function ValueContainer(props) {
  return <Box sx={props.selectProps.classes.valueContainer}>{props.children}</Box>;
}

function MultiValue({data, selectProps, removeProps, isFocused}) {
  return (
    <Chip
      tabIndex={-1}
      label={selectProps.getOptionLabel(data)}
      sx={{
        ...selectProps.classes.chip,
        ...(isFocused ? selectProps.classes.chipFocused : {}),
      }}
      onDelete={removeProps.onClick}
      deleteIcon={<CancelIcon sx={selectProps.classes.deleteIcon} {...removeProps} />}
    />
  );
}

function Menu(props) {
  return (
    <Paper square sx={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}

// Components mapping
const components = {
  Control,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
}

const MultipleSelection = (props) => {
    const classes = useStyles()

    const {label, single, disabled, value, onChange, data, displayField, keyField = '_id', theme} = props

    const selectStyles = {
      input: (base) => ({
        ...base,
        // color: theme.palette.text.primary,
        "& input": {
          font: "inherit",
        },
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      menu: (base) => ({
        ...base,
        zIndex: 9999, // Ensure the menu itself has a high z-index
      }),
      indicatorSeparator: (base) => ({
        display: 'none', // Hides the separator
      }),
    };

    return (
      <Select
        classes={classes}
        styles={selectStyles}
        options={data}
        components={components}
        textFieldProps={{
          label,
          InputLabelProps: {
            shrink: true,
            className: classes.label
          },
        }}
        value={value}
        getOptionLabel={item => item[displayField]}
        getOptionValue={item => item[keyField]}
        onChange={onChange}
        isMulti={!single}
        isDisabled={disabled}
        placeholder={`בחר ${label}`}
        menuPortalTarget={document.body}
      />
    )
};

export default MultipleSelection;
