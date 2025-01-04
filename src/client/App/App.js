import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import moment from 'moment';
import 'moment/locale/he';
moment.locale('he');

import { StylesProvider } from './styles';
import AppShell from './AppShell';
import TimeTracking from '../TimeTracking/TimeTracking';
import ClientsReport from '../Reports/ClientsReport';
import ActivitiesReport from '../Reports/ActivitiesReport';
import UsersReport from '../Reports/UsersReport';
import AdvancedReport from '../Reports/AdvancedReport';
import Users from '../Settings/Users';
import Activities from '../Settings/Activities';
import Clients from '../Settings/Clients';
import LoginForm from '../Auth/LoginForm';
import ChangePassword from '../Auth/ChangePassword';

import * as authService from 'core/authService';

const App = () => {
  const [isAuthRestored, setIsAuthRestored] = useState(false);

  useEffect(() => {
    const restoreAuth = async () => {
      await authService.restoreAuth();
      setIsAuthRestored(true);
    };
    restoreAuth();
  }, []);

  if (!isAuthRestored) {
    return null; // Render nothing until auth is restored
  }

  return (
    <StylesProvider>
      <>
        <CssBaseline />
        <Router>
          <AppShell>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Navigate to={getRedirectUrl()} replace />} />
                <Route path="/login" element={<LoginForm />} />
                <Route
                  path="/changepassword"
                  element={<PrivateRoute element={<ChangePassword />} />}
                />
                <Route
                  path="/timetracking"
                  element={<PrivateRoute element={<TimeTracking />} />}
                />
                <Route
                  path="/clientsreport"
                  element={<PrivateRoute element={<ClientsReport />} adminOnly />}
                />
                <Route
                  path="/usersreport"
                  element={<PrivateRoute element={<UsersReport />} adminOnly />}
                />
                <Route
                  path="/activitiesreport"
                  element={<PrivateRoute element={<ActivitiesReport />} adminOnly />}
                />
                <Route
                  path="/advancedreport"
                  element={<PrivateRoute element={<AdvancedReport />} adminOnly />}
                />
                <Route
                  path="/users/:userId"
                  element={<PrivateRoute element={<Users />} adminOnly />}
                />
                <Route
                  path="/users"
                  element={<PrivateRoute element={<Users />} adminOnly />}
                />
                <Route
                  path="/clients/:clientId"
                  element={<PrivateRoute element={<Clients />} adminOnly />}
                />
                <Route
                  path="/clients"
                  element={<PrivateRoute element={<Clients />} adminOnly />}
                />
                <Route
                  path="/activities"
                  element={<PrivateRoute element={<Activities />} adminOnly />}
                />
                <Route path="*" element={<Navigate to={getRedirectUrl()} replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </Router>
      </>
    </StylesProvider>
  );
};

const PrivateRoute = ({ element, adminOnly }) => {
  const user = authService.getSignedInUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/timetracking" replace />;
  }
  return element;
};

const getRedirectUrl = () => {
  const user = authService.getSignedInUser();
  if (!user) {
    return '/login';
  }
  return user.isAdmin ? '/usersreport' : '/timetracking';
};

export default App;
