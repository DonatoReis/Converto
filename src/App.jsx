// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import NotificationPrompt from './components/NotificationPrompt';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import './index.css';

/**
 * Private Route component to handle authentication
 * Redirects to login page if not authenticated
 */
const PrivateRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2B4FFF]"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

/**
 * Public Route component for auth pages
 * Redirects to dashboard if already authenticated
 */
const PublicRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2B4FFF]"></div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : element;
};

const AppContent = () => {
  const { loading, isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const [appLoaded, setAppLoaded] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    localStorage.getItem('notification_prompt_status') || null
  );

  useEffect(() => {
    // Set app as loaded once auth is checked
    if (!loading) {
      setAppLoaded(true);
    }
  }, [loading]);
  
  // Handle notification prompt response
  const handleNotificationPromptResponse = (status) => {
    console.log(`Notification permission status: ${status}`);
    setNotificationStatus(status);
    
    // Here you could trigger additional logic based on notification permission
    // For example, you might want to show a different UI or set up specific features
  };

  // Global page transition for smoother UX
  const pageTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className={`${appLoaded ? 'animate-fadeIn' : ''}`}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute 
              element={<LoginScreen />} 
            />
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute 
              element={<RegisterScreen />} 
            />
          } 
        />
        
        {/* Private routes */}
        <Route 
          path="/dashboard/*" 
          element={
            <PrivateRoute 
              element={<DashboardScreen />} 
            />
          } 
        />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Notification permission prompt - only show for authenticated users */}
      {isAuthenticated && appLoaded && (
        <NotificationPrompt 
          darkMode={darkMode} 
          onClose={handleNotificationPromptResponse} 
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
