import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page home-page">
      <h1>Coach-Fit</h1>
      <p>
        Data-driven strength training: track your lifts, see trends, and get
        progressive overload recommendations.
      </p>

      {user ? (
        <Link to="/dashboard" className="primary-btn">
          Go to dashboard
        </Link>
      ) : (
        <div className="home-actions">
          <Link to="/register" className="primary-btn">
            Get started
          </Link>
          <Link to="/login" className="secondary-btn">
            I already have an account
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;
