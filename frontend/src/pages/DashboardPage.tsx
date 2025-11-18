import React from "react";
import { useAuth } from "../hooks/useAuth";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name || "athlete"} 👋</p>
      <p>
        Here we’ll show recent workouts, progressive overload suggestions, and
        trend charts.
      </p>
    </div>
  );
};

export default DashboardPage;
