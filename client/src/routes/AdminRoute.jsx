import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function AdminRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  // Block if authenticated but profile hasn't loaded or is not admin
  if (!profile) return <Loader fullScreen />;
  if (profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
