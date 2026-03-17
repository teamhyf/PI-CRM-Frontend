import { Navigate } from 'react-router-dom';
import { useClaimantAuth } from '../context/ClaimantAuthContext';

export function ProtectedClaimantRoute({ children }) {
  const { isAuthenticated } = useClaimantAuth();
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }
  return children;
}

