import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ScrollToTop from './Components/ScrollToTop';

// Eager loading za kritične komponente
import Loading from './Components/Loading';
import ProtectedRoute from './Components/ProtectedRoute';

// Lazy loading za ostale komponente
const MainLayout = lazy(() => import('./Layouts/MainLayout'));
const Home = lazy(() => import('./Components/Home'));
const Login = lazy(() => import('./Components/Authorization/Login'));
const Register = lazy(() => import('./Components/Authorization/Register'));
const NotFound = lazy(() => import('./Components/NotFound'));
const Dashboard = lazy(() => import('./Components/Dashboard/Dashboard'));
const BookingPage = lazy(() => import('./Components/Booking/BookingPage'));

function App() {
  return (
    <Router>
      <ScrollToTop />
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