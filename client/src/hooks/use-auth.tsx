import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  isAdmin?: boolean;
  savedAddress?: string | null;
  membership?: {
    tierName: 'FREE' | 'STANDARD' | 'PRO';
    isActive: boolean;
    expiresAt?: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('auth-token')
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: true, // Always try to fetch - backend will check both token and cookie
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Important: send cookies
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (response.status === 401) {
          return null; // Not authenticated
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        return null;
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.token);
      setToken(data.token);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLocation('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.token);
      setToken(data.token);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLocation('/dashboard');
    },
  });

  const logout = async () => {
    try {
      // Call backend to clear cookie
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    }
    
    // Clear local storage and state
    localStorage.removeItem('auth-token');
    setToken(null);
    
    // Invalidate all queries and clear cache
    queryClient.invalidateQueries();
    queryClient.clear();
    
    // Redirect to home
    setLocation('/');
  };

  useEffect(() => {
    if (token) {
      // Set authorization header for API requests
      // This would typically be done in the queryClient configuration
    }
  }, [token]);

  const value = {
    user: (user as User) || null,
    isLoading,
    login: async (email: string, password: string) => {
      return loginMutation.mutateAsync({ email, password });
    },
    register: async (userData: any) => {
      return registerMutation.mutateAsync(userData);
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
