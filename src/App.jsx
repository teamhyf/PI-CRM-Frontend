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
import { Settings } from './pages/Settings';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ClaimantAuthProvider } from './context/ClaimantAuthContext';
import { ProviderAuthProvider } from './context/ProviderAuthContext';
import { PortalLayout } from './components/PortalLayout';
import { ProviderPortalLayout } from './components/ProviderPortalLayout';
import { PortalLogin } from './pages/portal/PortalLogin';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { PortalCaseDetail } from './pages/portal/PortalCaseDetail';
import { PortalProfile } from './pages/portal/PortalProfile';
import { CaseClosure } from './pages/portal/CaseClosure';
import { ProtectedClaimantRoute } from './components/ProtectedClaimantRoute';
import { ProviderLogin } from './pages/provider-portal/ProviderLogin';
import { ProviderDashboard } from './pages/provider-portal/ProviderDashboard';
import { ProviderCaseDetail } from './pages/provider-portal/ProviderCaseDetail';
import { ProtectedProviderRoute } from './components/ProtectedProviderRoute';

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
        <Route path="profile" element={<PortalProfile />} />
        <Route path="case/:claimantId" element={<PortalCaseDetail />} />
        <Route path="case-closure" element={<CaseClosure />} />
      </Route>
      <Route path="*" element={<Navigate to="/portal/login" replace />} />
    </Routes>
  );
}

function ProviderPortalRoutes() {
  return (
    <Routes>
      <Route path="login" element={<ProviderLogin />} />
      <Route
        element={
          <ProtectedProviderRoute>
            <ProviderPortalLayout />
          </ProtectedProviderRoute>
        }
      >
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="case/:caseId" element={<ProviderCaseDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/provider-portal/login" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/portal/*" element={<PortalRoutes />} />
      <Route
        path="/provider-portal/*"
        element={
          <ProviderAuthProvider>
            <ProviderPortalRoutes />
          </ProviderAuthProvider>
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
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Settings />
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
            <ClaimantAuthProvider>
              <AppRoutes />
            </ClaimantAuthProvider>
          </Router>
        </IntakeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
