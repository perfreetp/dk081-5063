import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import Login from '@/pages/Login';
import Tasks from '@/pages/Tasks';
import Verify from '@/pages/Verify';
import Authorize from '@/pages/Authorize';
import Anomaly from '@/pages/Anomaly';
import Followup from '@/pages/Followup';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loadInitialData } = useAppStore();

  useEffect(() => {
    if (!user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navigate to="/tasks" replace />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/verify"
          element={
            <PrivateRoute>
              <Verify />
            </PrivateRoute>
          }
        />
        <Route
          path="/authorize"
          element={
            <PrivateRoute>
              <Authorize />
            </PrivateRoute>
          }
        />
        <Route
          path="/anomaly"
          element={
            <PrivateRoute>
              <Anomaly />
            </PrivateRoute>
          }
        />
        <Route
          path="/followup"
          element={
            <PrivateRoute>
              <Followup />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </Router>
  );
}
