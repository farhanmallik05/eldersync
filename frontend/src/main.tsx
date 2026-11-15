import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AccessibilityProvider>
          <WorkspaceProvider>
            <App />
          </WorkspaceProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
