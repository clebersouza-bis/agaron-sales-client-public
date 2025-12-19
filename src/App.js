import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Proposals from './components/Proposals';
import ProposalForm from './components/ProposalForm';
import Users from './components/Users';
import Products from './components/Products';
import Clients from './components/Clients';
import ProductTour from './components/ProductTour';
import './App.css';

import { useAuth } from './contexts/AuthContext';

const AppContent = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated && <Navigation />}
      <main className={isAuthenticated ? 'main-content' : 'auth-content'} id="main-content">
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/proposals" replace />}
          />
          <Route
            path="/proposals"
            element={
              <ProtectedRoute>
                <Proposals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proposals/new"
            element={
              <ProtectedRoute>
                <ProposalForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proposals/:id/edit"
            element={
              <ProtectedRoute>
                <ProposalForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              // <ProtectedRoute roles={['Admin', 'Manager']}>
              <Products />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to="/proposals" replace />}
          />
          <Route
            path="*"
            element={<Navigate to="/proposals" replace />}
          />
        </Routes>
      </main>
      {isAuthenticated && <ProductTour />}
    </div>
  );
};


const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasRole(roles)) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AppContent;