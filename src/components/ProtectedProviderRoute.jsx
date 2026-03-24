import { Navigate } from 'react-router-dom';
import { useProviderAuth } from '../context/ProviderAuthContext';

export function ProtectedProviderRoute({ children }) {
  const { isAuthenticated } = useProviderAuth();
  if (!isAuthenticated) {
    return <Navigate to="/provider-portal/login" replace />;
  }
  return children;
}
