import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./Contexts/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Render the protected route's children
  return <Outlet />;
};

export default ProtectedRoute;
