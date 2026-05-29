import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SidebarLayout from './layouts/SidebarLayout';
import Overview from './pages/Overview';
import BookingsCRM from './pages/BookingsCRM';
import UsersCMS from './pages/UsersCMS';
import EventBookingsCMS from './pages/EventBookingsCMS';
import ServicesCMS from './pages/ServicesCMS';
import SlotsManager from './pages/SlotsManager';
import ProductsCMS from './pages/ProductsCMS';
import RewardsCMS from './pages/RewardsCMS';
import NotificationsCMS from './pages/NotificationsCMS';
import HomeCarouselCMS from './pages/HomeCarouselCMS';
import ServiceMediaCMS from './pages/ServiceMediaCMS';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('adminToken'));

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (!authToken) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          authToken ? <Navigate to="/dashboard" replace /> : <Login setAuthToken={setAuthToken} />
        } />
        
        <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/bookings" element={<BookingsCRM />} />
          <Route path="/users" element={<UsersCMS />} />
          <Route path="/event-bookings" element={<EventBookingsCMS />} />
          <Route path="/services" element={<ServicesCMS />} />
          <Route path="/slots" element={<SlotsManager />} />
          <Route path="/products" element={<ProductsCMS />} />
          <Route path="/rewards" element={<RewardsCMS />} />
          <Route path="/notifications" element={<NotificationsCMS />} />
          <Route path="/carousel" element={<HomeCarouselCMS />} />
          <Route path="/service-media" element={<ServiceMediaCMS />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
