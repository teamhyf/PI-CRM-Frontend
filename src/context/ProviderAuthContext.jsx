import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ProviderAuthContext = createContext();

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function parseStoredProvider() {
  const raw = localStorage.getItem('providerUser');
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    return {
      id: o.id,
      email: o.email,
      name: o.name || '',
    };
  } catch {
    return null;
  }
}

export function ProviderAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('providerToken'));
  const [provider, setProvider] = useState(parseStoredProvider);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  const logout = () => {
    setToken(null);
    setProvider(null);
    setCases([]);
    localStorage.removeItem('providerToken');
    localStorage.removeItem('providerUser');
  };

  const persistProvider = (next) => {
    setProvider(next);
    if (next) {
      localStorage.setItem('providerUser', JSON.stringify(next));
    } else {
      localStorage.removeItem('providerUser');
    }
  };

  const fetchCases = async (tkn) => {
    const base = getBaseUrl();
    const auth = tkn || token || localStorage.getItem('providerToken');
    if (!auth) return [];
    const res = await fetch(`${base}/api/provider-portal/cases`, {
      headers: { Authorization: `Bearer ${auth}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to load cases');
    const list = Array.isArray(data.cases) ? data.cases : [];
    setCases(list);
    return list;
  };

  const login = async (email, password) => {
    const base = getBaseUrl();
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/provider-portal/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      localStorage.setItem('providerToken', data.token);
      persistProvider(data.provider || null);
      await fetchCases(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verify = async (tkn) => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/provider-portal/auth/verify`, {
      headers: { Authorization: `Bearer ${tkn}` },
    });
    if (!res.ok) throw new Error('Invalid token');
    return res.json();
  };

  useEffect(() => {
    if (!token) return;
    verify(token)
      .then((data) => {
        if (data.provider) {
          persistProvider({
            id: data.provider.id,
            email: data.provider.email,
            name: data.provider.name || '',
          });
        }
        return fetchCases(token);
      })
      .catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      provider,
      cases,
      loading,
      login,
      logout,
      fetchCases,
      isAuthenticated: !!token,
    }),
    [token, provider, cases, loading]
  );

  return (
    <ProviderAuthContext.Provider value={value}>
      {children}
    </ProviderAuthContext.Provider>
  );
}

export function useProviderAuth() {
  const ctx = useContext(ProviderAuthContext);
  if (!ctx) throw new Error('useProviderAuth must be used within ProviderAuthProvider');
  return ctx;
}
