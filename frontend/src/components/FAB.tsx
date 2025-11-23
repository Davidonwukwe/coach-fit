import React from "react";
import { Link } from "react-router-dom";

const FAB: React.FC = () => {
  return (
    <Link
      to="/log-workout"
      style={{
        position: "fixed",
        right: "2rem",
        bottom: "2rem",
        background: "#3b82f6",
        color: "white",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "2rem",
        textDecoration: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      +
    </Link>
  );
};

export default FAB;
