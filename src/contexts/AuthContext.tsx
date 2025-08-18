import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthContextType, User } from '../types';
import { mockUser } from '../data/mockData';
import { loginUser } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Call our new API service
      const data = await loginUser({ email, password });

      if (data.token) {
        // For a real app, you'd decode the token to get user info.
        // For now, we'll keep using the mockUser for display purposes
        // and store the token for future authenticated requests.
        localStorage.setItem('vyapari_token', data.token);
        setUser(mockUser); // You can update this later to use info from the token
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
    finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};