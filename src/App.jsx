import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import PatientPortal from '@/pages/PatientPortal';
import DoctorDashboard from '@/pages/DoctorDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/patient/*"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor-dashboard/*"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
