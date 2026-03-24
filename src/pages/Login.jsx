import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AISparklesIcon } from '../components/AIIcon';
import { BackToHomeLink } from '../components/BackToHomeLink';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <BackToHomeLink />
      </div>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-lg bg-blue-100">
              <AISparklesIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Personal Injury CRM</h1>
            <p className="text-sm text-gray-600 mt-2">Sign in to access your dashboard</p>
          </div>

          {/* Demo Credentials Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Admin:</strong> admin@lawfirm.com / Admin@123</p>
              <p><strong>Attorney:</strong> attorney@lawfirm.com / Attorney@123</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="attorney@lawfirm.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © 2026 AI Personal Injury CRM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
