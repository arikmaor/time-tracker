import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated for React 18
import { App } from './App';

const rootElement = document.getElementById('root');

// Create a React 18 root
const root = ReactDOM.createRoot(rootElement);

const render = (Component) => {
  root.render(
    <React.StrictMode>
      <Component />
    </React.StrictMode>
  );
};

render(App);

// Enable Hot Module Replacement (HMR) if available
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').App; // Dynamically import updated App
    render(NextApp);
  });
}
