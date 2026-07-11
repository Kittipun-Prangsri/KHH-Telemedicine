import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'khh_auth_token';
const USER_KEY = 'khh_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบ token กับ backend เมื่อโหลดครั้งแรก
  useEffect(() => {
    async function verifyToken() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user);
      } catch {
        // Token หมดอายุหรือไม่ถูกต้อง
        clearSession();
      } finally {
        setLoading(false);
      }
    }
    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    // ตั้ง default axios auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }

  const signIn = useCallback(async (providerId, password) => {
    const res = await axios.post('/api/auth/login', { providerId, password });
    saveSession(res.data);
    return res.data.user;
  }, []);

  const signOut = useCallback(async () => {
    try { await axios.post('/api/auth/logout'); } catch { /* ignore */ }
    clearSession();
  }, []);

  // ตั้งค่า axios interceptor เพื่อแนบ token อัตโนมัติ
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
