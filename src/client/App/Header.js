import React from 'react';
import {withRouter, Route, Link} from 'react-router-dom'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import SettingsIcon from '@material-ui/icons/Settings'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';

import * as authService from 'core/authService'

const styles = {
  root: {
    flexGrow: 1,
    marginBottom: 20
  },
  flex: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: -12,
    marginLeft: 20,
  },
};

const NavLink = ({ to, children, className, activeClassName, ...rest }) => (
  <Route
    path={typeof to === "object" ? to.pathname : to}
    children={({ location, match }) => {
      const isActive = !!match;
      return (
        <Link
          {...rest}
          className={isActive
            ? [className, activeClassName].filter(i => i).join(" ")
            : className
          }
          to={to}
        >
          {typeof children === 'function' ? children(isActive) : children}
        </Link>
      )
    }}
  />
)

const NavMenuItem = withRouter(({history, to, children, onClick}) => (
  <MenuItem onClick={(e) => {history.push(to); onClick(e)}}>
    <NavLink to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      {isActive => children}
    </NavLink>
  </MenuItem>
))

const NavButton = ({to, children}) => (
  <NavLink to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
    {isActive => <Button color="inherit" variant={isActive ? 'outlined' : 'text'} style={{borderColor: 'red'}}>{children}</Button>}
  </NavLink>
)

const NavIcon = ({to, children}) => (
  <NavLink to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
    {isActive => children}
  </NavLink>
)

class AppHeader extends React.Component {

  state = {
    anchorEl: null
  }

  static propTypes = {
    classes: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    displayName: PropTypes.string.isRequired
  };

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  signOut() {
    authService.signOut()
    this.props.history.push('/login')
  }

  render() {
    const {anchorEl} = this.state
    const {classes, isAdmin, displayName} = this.props

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="title" color="inherit" className={classes.flex}>
              שמיר יעוץ והדרכה - {displayName}
            </Typography>
            {isAdmin && <NavButton to='/clientsreport'>דוח לקוחות</NavButton>}
            {isAdmin && <NavButton to='/usersreport'>דוח עובדים</NavButton>}
            {isAdmin && <NavButton to='/activitiesreport'>דוח פעילות</NavButton>}
            {isAdmin && <NavButton to='/advancedreport'>דוח מפורט</NavButton>}
            <NavButton to='/timetracking'>דיווח שעות</NavButton>
            <IconButton
              aria-owns={open ? 'menu-appbar' : null}
              aria-haspopup="true"
              onClick={this.handleMenu}
              color="inherit"
              >
              <SettingsIcon/>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={this.state.anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={!!anchorEl}
              onClose={this.handleClose}
            >
              {isAdmin && <NavMenuItem to='/activities' onClick={this.handleClose}>פעילויות</NavMenuItem>}
              {isAdmin && <NavMenuItem to='/clients' onClick={this.handleClose}>לקוחות</NavMenuItem>}
              {isAdmin && <NavMenuItem to='/users' onClick={this.handleClose}>עובדים</NavMenuItem>}
              {isAdmin && <Divider />}
              <NavMenuItem to='/changepassword' onClick={this.handleClose}>שינוי סיסמא</NavMenuItem>
              <MenuItem onClick={this.signOut}>יציאה</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

export default withRouter(withStyles(styles)(AppHeader));
