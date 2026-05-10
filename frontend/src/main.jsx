import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import SeatPage from './pages/SeatPage.jsx';
import ConfirmPage from './pages/ConfirmPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { AuthProvider, BookingProvider, RequireAdmin, RequireBooking } from './state.jsx';
import './styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id/seats" element={<SeatPage />} />
              <Route
                path="/bookings/confirm"
                element={
                  <RequireBooking>
                    <ConfirmPage />
                  </RequireBooking>
                }
              />
              <Route path="/bookings/history" element={<HistoryPage />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminPage />
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
