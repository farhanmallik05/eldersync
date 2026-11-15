import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AccessibilityProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </React.StrictMode>
);
