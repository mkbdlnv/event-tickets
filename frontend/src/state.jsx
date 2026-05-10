import React, { createContext, useContext, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { setAccessToken } from './api/index.js';

const AuthContext = createContext(null);
const BookingContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useBooking() {
  return useContext(BookingContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      user,
      signIn(data) {
        setAccessToken(data.accessToken);
        setUser(data.user);
      },
      signOut() {
        setAccessToken(null);
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(null);
  return <BookingContext.Provider value={{ draft, setDraft }}>{children}</BookingContext.Provider>;
}

export function RequireBooking({ children }) {
  const { draft } = useBooking();
  const location = useLocation();
  if (!draft) return <Navigate to="/events" replace state={{ from: location }} />;
  return children;
}
