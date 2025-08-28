"use client";

import { createContext, useContext, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
}

const mockUser: UserProfile = {
  uid: 'mock-user-uid-123',
  email: 'dev@triviarena.com',
  name: 'Dev User',
  photoURL: 'https://picsum.photos/100/100',
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  loading: false,
  firebaseUser: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    user: mockUser,
    loading: false,
    firebaseUser: null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
