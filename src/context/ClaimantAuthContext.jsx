import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ClaimantAuthContext = createContext();

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export function ClaimantAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('claimantToken'));
  const [claimant, setClaimant] = useState(() => {
    const raw = localStorage.getItem('claimantUser');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const logout = () => {
    setToken(null);
    setClaimant(null);
    localStorage.removeItem('claimantToken');
    localStorage.removeItem('claimantUser');
  };

  const login = async (email, password) => {
    const base = getBaseUrl();
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/portal/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      setClaimant(data.claimant);
      localStorage.setItem('claimantToken', data.token);
      localStorage.setItem('claimantUser', JSON.stringify(data.claimant));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verify = async (tkn) => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/portal/auth/verify`, {
      headers: { Authorization: `Bearer ${tkn}` },
    });
    if (!res.ok) throw new Error('Invalid token');
    return res.json();
  };

  // Best-effort verify on mount; if invalid, logout.
  useEffect(() => {
    if (!token) return;
    verify(token).catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      claimant,
      loading,
      login,
      logout,
      isAuthenticated: !!token,
    }),
    [token, claimant, loading]
  );

  return (
    <ClaimantAuthContext.Provider value={value}>
      {children}
    </ClaimantAuthContext.Provider>
  );
}

export function useClaimantAuth() {
  const ctx = useContext(ClaimantAuthContext);
  if (!ctx) throw new Error('useClaimantAuth must be used within ClaimantAuthProvider');
  return ctx;
}

