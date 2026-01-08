import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './components/AdminRoute';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Branding Manager to handle dynamic title and favicon
const BrandingManager = ({ children }) => {
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/smtp`);
        if (res.ok) {
          const settings = await res.json();
          if (settings.app_name) {
            document.title = settings.app_name;
          }
          if (settings.app_favicon_url) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = settings.app_favicon_url;
          }
        }
      } catch (err) {
        console.error('Failed to load branding:', err);
      }
    };
    fetchBranding();
  }, []);

  return children;
};

// Wrapper for Google Auth
const AuthWrapper = ({ children }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

function App() {
  return (
    <AuthWrapper>
      <BrandingManager>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<Navigate to="/admin/profile" replace />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="templates" element={<AdminTemplatesPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BrandingManager>
    </AuthWrapper>
  );
}

export default App;
