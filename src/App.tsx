import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import Login from '@/pages/Login';
import Tasks from '@/pages/Tasks';
import Verify from '@/pages/Verify';
import Authorize from '@/pages/Authorize';
import Anomaly from '@/pages/Anomaly';
import Followup from '@/pages/Followup';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loadInitialData, isLoading } = useAppStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        await loadInitialData();
      }
      setIsChecking(false);
    };
    checkAuth();
  }, [user, loadInitialData]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xl text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }

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
          path="/verify/:taskId"
          element={
            <PrivateRoute>
              <Verify />
            </PrivateRoute>
          }
        />
        <Route
          path="/verify"
          element={
            <PrivateRoute>
              <Navigate to="/tasks" replace />
            </PrivateRoute>
          }
        />
        <Route
          path="/authorize/:taskId"
          element={
            <PrivateRoute>
              <Authorize />
            </PrivateRoute>
          }
        />
        <Route
          path="/authorize"
          element={
            <PrivateRoute>
              <Navigate to="/tasks" replace />
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
