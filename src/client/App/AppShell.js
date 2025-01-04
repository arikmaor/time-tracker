import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from './Header';
import * as authService from 'core/authService';
import ErrorDisplay from './ErrorDisplay';

const useStyles = makeStyles({
  root: {
    margin: 0,
    overflow: 'hidden',
  },
});

const AppShell = ({ children }) => {
  const classes = useStyles();
  const user = authService.getSignedInUser();

  return (
    <div className={classes.root}>
      {user && <Header isAdmin={user.isAdmin} displayName={user.displayName} />}
      <main>
        <ErrorDisplay />
        {children}
      </main>
    </div>
  );
};

export default AppShell;
