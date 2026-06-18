import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import Customers from '@/pages/Customers';
import Workstations from '@/pages/Workstations';
import Rates from '@/pages/Rates';
import Bills from '@/pages/Bills';
import Processing from '@/pages/Processing';

export default function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/workstations" element={<Workstations />} />
          <Route path="/rates" element={<Rates />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}
