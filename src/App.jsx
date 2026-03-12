import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntakeProvider } from './context/IntakeContext';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import { IntakeForm } from './pages/IntakeForm';
import { UserManagement } from './pages/UserManagement';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
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
        path="/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <UserManagement />
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
      <IntakeProvider>
        <Router>
          <AppRoutes />
        </Router>
      </IntakeProvider>
    </AuthProvider>
  );
}

export default App;
