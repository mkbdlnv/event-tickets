import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import SeatPage from './pages/SeatPage.jsx';
import ConfirmPage from './pages/ConfirmPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { AuthProvider, BookingProvider, RequireBooking } from './state.jsx';
import './styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
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
            </Routes>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
