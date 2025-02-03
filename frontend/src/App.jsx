import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ScrollToTop from './Components/Common/ScrollToTop';
import { Toaster } from 'react-hot-toast';

// Eager loading za kritične komponente
import Loading from './Components/Common/Loading';
import ProtectedRoute from './Components/Common/ProtectedRoute';

// Lazy loading za ostale komponente
const MainLayout = lazy(() => import('./Layouts/MainLayout'));
const Home = lazy(() => import('./Components/Home/Home'));
const Login = lazy(() => import('./Components/Authorization/Login'));
const Register = lazy(() => import('./Components/Authorization/Register'));
const NotFound = lazy(() => import('./Components/Common/NotFound'));
const Dashboard = lazy(() => import('./Components/Dashboard/Dashboard'));
const BookingPage = lazy(() => import('./Components/Booking/BookingPage'));

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster
        position="top-center"
        containerStyle={{
          top: 5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '600px',
          padding: '0 16px'
        }}
        gutter={8}
        toastOptions={{
          duration: 1500,
          className: 'sm:max-w-[400px] w-full',
          style: {
            background: '#18181B',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            width: '100%',
            maxWidth: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backgroundColor: '#18181B',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backgroundColor: '#18181B',
            },
          },
        }}
      />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Dashboard route */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Public routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/booking/:salonId" element={<BookingPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;