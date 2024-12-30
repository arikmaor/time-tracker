import React from 'react'
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom"
import CssBaseline from '@material-ui/core/CssBaseline';

import moment from 'moment'
import 'moment/locale/he'
moment.locale('he')

import AppShell from './AppShell'
import {StylesProvider} from './styles'
import TimeTracking from 'TimeTracking/TimeTracking'
import ClientsReport from 'Reports/ClientsReport'
import ActivitiesReport from 'Reports/ActivitiesReport'
import UsersReport from 'Reports/UsersReport'
import AdvancedReport from 'Reports/AdvancedReport'
import Users from 'Settings/Users'
import Activities from 'Settings/Activities'
import Clients from 'Settings/Clients'
import LoginForm from 'Auth/LoginForm'
import ChangePassword from 'Auth/ChangePassword'

import * as authService from 'core/authService'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.init()
  }

  async init() {
    await authService.restoreAuth()
  }

  render() {
    return (
      <StylesProvider>
        <CssBaseline />
        <Router>
          <AppShell>
            <Switch>
              <Route exact path="/" render={() => <Redirect to={getRedirectUrl()}/>} />
              <Route path="/login" component={LoginForm} />
              <PrivateRoute path="/changepassword" component={ChangePassword} />
              <PrivateRoute path="/timetracking" component={TimeTracking} />
              <PrivateRoute adminOnly path="/clientsreport" component={ClientsReport} />
              <PrivateRoute adminOnly path="/usersreport" component={UsersReport} />
              <PrivateRoute adminOnly path="/activitiesreport" component={ActivitiesReport} />
              <PrivateRoute adminOnly path="/advancedreport" component={AdvancedReport} />
              <PrivateRoute adminOnly path="/users/:userId" component={Users} />
              <PrivateRoute adminOnly path="/users" component={Users} />
              <PrivateRoute adminOnly path="/clients/:clientId" component={Clients} />
              <PrivateRoute adminOnly path="/clients" component={Clients} />
              <PrivateRoute adminOnly path="/activities" component={Activities} />
              <Redirect to={getRedirectUrl()} />
            </Switch>
          </AppShell>
        </Router>
      </StylesProvider>
    )
  }
}

const PrivateRoute = ({ component: Component, adminOnly, ...rest }) => (
  <Route
    {...rest}
    render={props => {
      const user = authService.getSignedInUser()
      if (!user) {
        return (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }

      if (adminOnly && !user.isAdmin) {
        return (
          <Redirect
            to={{
              pathname: "/timetracking"
            }}
          />
        )
      }

      return <Component {...props} />
    }}
  />
);

const getRedirectUrl = () => {
  const user = authService.getSignedInUser()
  if (!user) {
    return "/login"
  }

  return user.isAdmin ? '/usersreport' : '/timetracking'
}

export default App
