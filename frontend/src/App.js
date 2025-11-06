import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import TakeTest from "./pages/TakeTest";
import TestResults from "./pages/TestResults";
import ResultsSummary from "./pages/ResultsSummary";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Create axios instance with interceptor
export const axiosInstance = axios.create({
  baseURL: API,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance
        .get("/auth/me")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl font-semibold text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                user.role === "admin" ? (
                  <Navigate to="/admin" replace />
                ) : user.role === "participant" ? (
                  <Navigate to="/participant" replace />
                ) : user.role === "supervisor" ? (
                  <Navigate to="/supervisor" replace />
                ) : user.role === "trainer" ? (
                  <Navigate to="/trainer" replace />
                ) : user.role === "coordinator" ? (
                  <Navigate to="/coordinator" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              user && user.role === "admin" ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/participant"
            element={
              user && user.role === "participant" ? (
                <ParticipantDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/supervisor"
            element={
              user && user.role === "supervisor" ? (
                <SupervisorDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/trainer"
            element={
              user && user.role === "trainer" ? (
                <TrainerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/coordinator"
            element={
              user && user.role === "coordinator" ? (
                <CoordinatorDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/take-test/:testId/:sessionId"
            element={
              user && user.role === "participant" ? (
                <TakeTest />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/test-results/:resultId"
            element={
              user && user.role === "participant" ? (
                <TestResults />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                user.role === "participant" ? (
                  <Navigate to="/participant" replace />
                ) : user.role === "admin" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/results-summary/:sessionId"
            element={
              user && (user.role === "admin" || user.role === "coordinator" || user.role === "trainer") ? (
                <ResultsSummary />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
