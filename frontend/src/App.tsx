import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LogWorkoutPage from "./pages/LogWorkoutPage";
import WorkoutHistoryPage from "./pages/WorkoutHistoryPage";
import WorkoutAnalyticsPage from "./pages/AnalyticsPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";
import WorkoutDetailsPage from "./pages/WorkoutDetailsPage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="/log-workout" element={<LogWorkoutPage />} />


            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <WorkoutHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />


            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <WorkoutAnalyticsPage />
                </ProtectedRoute>
              }
            />
              <Route path="/workout/:id" element={
                <ProtectedRoute>
                  <WorkoutDetailsPage />
                </ProtectedRoute>
              } />

          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;