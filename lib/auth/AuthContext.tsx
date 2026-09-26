'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserSession {
  token: string;
  user_id: string;
  email: string;
  name: string;
  role: 'AUTHORITY' | 'CITIZEN' | 'RESPONSE';
  department: string;
  organization: string;
  created_at: string;
  expires_at: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'neer_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Rehydrate session from localStorage on mount
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const parsed: UserSession = JSON.parse(stored);
        // Check expiration
        if (new Date(parsed.expires_at) > new Date()) {
          setUser(parsed);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      let res: Response;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      } catch (proxyErr) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        res = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      }

      const data = await res.json();
      if (res.ok && data.token) {
        const sessionData: UserSession = data;
        setUser(sessionData);
        localStorage.setItem(TOKEN_KEY, JSON.stringify(sessionData));

        // Redirect based on role
        if (sessionData.role === 'AUTHORITY') {
          router.push('/');
        } else if (sessionData.role === 'CITIZEN') {
          router.push('/citizen');
        } else if (sessionData.role === 'RESPONSE') {
          router.push('/response');
        }
        return { success: true };
      } else {
        return { success: false, message: data.detail || 'Invalid email or password.' };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error. Please check your network connection.' };
    }
  };

  const logout = async () => {
    if (user?.token) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
      } catch (e) {
        // Silent fail on network issue during logout
      }
    }
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
