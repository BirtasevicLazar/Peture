import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (token) {
      // Prevent back navigation when authenticated
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = function(event) {
        window.history.pushState(null, '', window.location.href);
      };

      return () => {
        window.onpopstate = null;
      };
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
