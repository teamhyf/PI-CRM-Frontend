import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ClaimantAuthContext = createContext();

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function parseStoredClaimant() {
  const raw = localStorage.getItem('claimantUser');
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    return {
      id: o.id,
      email: o.email,
      fullName: o.fullName || '',
      cases: Array.isArray(o.cases) ? o.cases : [],
    };
  } catch {
    return null;
  }
}

export function ClaimantAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('claimantToken'));
  const [claimant, setClaimant] = useState(parseStoredClaimant);
  const [loading, setLoading] = useState(false);

  const logout = () => {
    setToken(null);
    setClaimant(null);
    localStorage.removeItem('claimantToken');
    localStorage.removeItem('claimantUser');
  };

  const persistClaimant = (next) => {
    setClaimant(next);
    if (next) {
      localStorage.setItem('claimantUser', JSON.stringify(next));
    } else {
      localStorage.removeItem('claimantUser');
    }
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
      localStorage.setItem('claimantToken', data.token);
      persistClaimant({
        ...data.claimant,
        cases: data.cases || [],
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const switchCase = async (claimantId) => {
    const base = getBaseUrl();
    const t = token || localStorage.getItem('claimantToken');
    if (!t) throw new Error('Not signed in');
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/portal/auth/switch-case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ claimantId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to switch case');
      setToken(data.token);
      localStorage.setItem('claimantToken', data.token);
      persistClaimant({
        ...data.claimant,
        cases: data.cases || [],
      });
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

  // Best-effort verify on mount; if invalid, logout. Refresh case list for multi-case users.
  useEffect(() => {
    if (!token) return;
    verify(token)
      .then((data) => {
        if (Array.isArray(data.cases)) {
          setClaimant((c) => {
            const next = {
              id: data.user?.id ?? c?.id,
              email: data.user?.email ?? c?.email,
              fullName: c?.fullName || '',
              cases: data.cases,
            };
            localStorage.setItem('claimantUser', JSON.stringify(next));
            return next;
          });
        }
      })
      .catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      claimant,
      cases: claimant?.cases || [],
      loading,
      login,
      logout,
      switchCase,
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
