import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntakeProvider } from './context/IntakeContext';
import { ToastProvider } from './context/ToastContext';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import { Leads } from './pages/Leads';
import { IntakeForm } from './pages/IntakeForm';
import { AIIntakePage } from './pages/AIIntakePage';
import { UserManagement } from './pages/UserManagement';
import { Providers } from './pages/Providers';
import { Claimants } from './pages/Claimants';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ClaimantAuthProvider } from './context/ClaimantAuthContext';
import { PortalLayout } from './components/PortalLayout';
import { PortalLogin } from './pages/portal/PortalLogin';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { PortalCaseDetail } from './pages/portal/PortalCaseDetail';
import { CaseClosure } from './pages/portal/CaseClosure';
import { ProtectedClaimantRoute } from './components/ProtectedClaimantRoute';

function PortalRoutes() {
  return (
    <Routes>
      <Route path="login" element={<PortalLogin />} />
      <Route
        element={
          <ProtectedClaimantRoute>
            <PortalLayout />
          </ProtectedClaimantRoute>
        }
      >
        <Route path="dashboard" element={<PortalDashboard />} />
        <Route path="case/:claimantId" element={<PortalCaseDetail />} />
        <Route path="case-closure" element={<CaseClosure />} />
      </Route>
      <Route path="*" element={<Navigate to="/portal/login" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/portal/*"
        element={
          <ClaimantAuthProvider>
            <PortalRoutes />
          </ClaimantAuthProvider>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <Layout>
              <Leads />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/intake"
        element={
          <ProtectedRoute>
            <Layout>
              <IntakeForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-intake"
        element={
          <ProtectedRoute>
            <Layout>
              <AIIntakePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <Layout>
              <Cases />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CaseDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/providers"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Providers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/claimants"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Claimants />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <IntakeProvider>
          <Router>
            <AppRoutes />
          </Router>
        </IntakeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
