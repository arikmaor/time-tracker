import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SettingsIcon from "@mui/icons-material/Settings";
import * as authService from "core/authService";

// Styled Components
const Root = styled("div")(({ theme }) => ({
  flexGrow: 1,
  marginBottom: theme.spacing(2),
}));

const FlexTypography = styled(Typography)(() => ({
  flexGrow: 1,
}));

const NavButtonLink = styled(NavLink)(({ theme }) => ({
  textDecoration: "none",
  color: 'white',
  "&.active": {
    border: `1px solid white`,
    borderRadius: theme.shape.borderRadius,
  },
}));

const NavButton = ({ to, children }) => (
  <NavButtonLink to={to}>
    <Button color="inherit">{children}</Button>
  </NavButtonLink>
);

NavButton.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const NavMenuItem = ({ to, children, onClick }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    navigate(to);
  };

  return (
    <MenuItem onClick={handleClick}>
      <Typography>{children}</Typography>
    </MenuItem>
  );
};

NavMenuItem.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

const appPages = [
  {
    path: "clientsreport",
    label: "דוח לקוחות",
    isAdminRequired: true,
  },
  {
    path: "usersreport",
    label: "דוח עובדים",
    isAdminRequired: true,
  },
  {
    path: "activitiesreport",
    label: "דוח פעילות",
    isAdminRequired: true,
  },
  {
    path: "advancedreport",
    label: "דוח מפורט",
    isAdminRequired: true,
  },
  {
    path: "timetracking",
    label: "דיווח שעות",
    isAdminRequired: false,
  },
]

const AppHeader = ({ isAdmin, displayName }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentPage, setCurrentPage] = useState("timetracking");
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const signOut = () => {
    authService.signOut();
    navigate("/login");
  };

  return (
    <Root>
      <AppBar position="static">
        <Toolbar>
          <FlexTypography variant="h6">
            שמיר יעוץ והדרכה - {displayName}
          </FlexTypography>
          {appPages.map((page, index) => (!page.isAdminRequired || isAdmin) && (
            <NavButton to={`/${page.path}`} key={index}>
              {page.label}
            </NavButton>
          ))}
          <IconButton
            aria-controls={anchorEl ? "menu-appbar" : undefined}
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <SettingsIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {isAdmin && (
              <NavMenuItem to="/activities" onClick={handleClose}>
                פעילויות
              </NavMenuItem>
            )}
            {isAdmin && (
              <NavMenuItem to="/clients" onClick={handleClose}>
                לקוחות
              </NavMenuItem>
            )}
            {isAdmin && (
              <NavMenuItem to="/users" onClick={handleClose}>
                עובדים
              </NavMenuItem>
            )}
            {isAdmin && <Divider />}
            <NavMenuItem to="/changepassword" onClick={handleClose}>
              שינוי סיסמא
            </NavMenuItem>
            <MenuItem onClick={signOut}>יציאה</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </Root>
  );
};

AppHeader.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  displayName: PropTypes.string.isRequired,
};

export default AppHeader;
