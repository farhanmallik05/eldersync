import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string;
  loginAs: (role: UserRole) => void;
  logout: () => void;
}

const SEEDED_ACCOUNTS: Record<UserRole, User> = {
  PATIENT: {
    uid: 'demo-patient',
    name: 'Robert Vance',
    email: 'robert.vance@eldersync.health',
    role: 'PATIENT',
  },
  CAREGIVER: {
    uid: 'demo-caregiver',
    name: 'Nurse Sarah Jenkins',
    email: 'sarah.jenkins@eldercare.org',
    role: 'CAREGIVER',
  },
  FAMILY: {
    uid: 'demo-family',
    name: 'David Vance (Son)',
    email: 'david.vance@family.org',
    role: 'FAMILY',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with demo-patient logged in by default for instant evaluation
  const [user, setUser] = useState<User | null>(SEEDED_ACCOUNTS.PATIENT);
  const [token, setToken] = useState<string>('demo-patient-token');

  const loginAs = (role: UserRole) => {
    const selectedUser = SEEDED_ACCOUNTS[role];
    setUser(selectedUser);
    setToken(`demo-${role.toLowerCase()}-token`);
  };

  const logout = () => {
    setUser(null);
    setToken('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loginAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
