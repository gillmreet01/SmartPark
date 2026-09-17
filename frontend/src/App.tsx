import { Navigate, Route, Routes } from 'react-router-dom';
import { LiveDataProvider } from './store/live';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ParkingMap from './pages/ParkingMap';
import Sessions from './pages/Sessions';
import Reservations from './pages/Reservations';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <LiveDataProvider>
            <AppLayout />
          </LiveDataProvider>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/map" element={<ParkingMap />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
