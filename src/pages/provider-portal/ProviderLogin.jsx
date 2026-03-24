import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useProviderAuth } from '../../context/ProviderAuthContext';
import { AISparklesIcon, AIBadge } from '../../components/AIIcon';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function ProviderLogin() {
  const navigate = useNavigate();
  const { login, loading } = useProviderAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.email.trim(), data.password);
      navigate('/provider-portal/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300 relative">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg">
                <AISparklesIcon className="w-3.5 h-3.5" />
              </span>
            </div>
            <AIBadge size="md" className="self-start mt-1" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Provider Portal
          </h1>
          <p className="mt-2 text-gray-600 font-medium flex items-center justify-center gap-2">
            <AISparklesIcon className="w-4 h-4 text-indigo-500" />
            Sign in to view assigned cases and upload documents
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error ? (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-4 rounded-xl animate-scale-in">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            ) : null}

            <div>
              <label htmlFor="provider-portal-email" className="block text-sm font-medium text-gray-700 mb-2">
                Portal email
              </label>
              <input
                id="provider-portal-email"
                type="email"
                autoComplete="email"
                placeholder="portal@clinic.com"
                className="input-field"
                {...register('email')}
              />
              {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <label htmlFor="provider-portal-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="provider-portal-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-field"
                {...register('password')}
              />
              {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Staff member?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Admin sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          © 2026 AI Personal Injury CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
