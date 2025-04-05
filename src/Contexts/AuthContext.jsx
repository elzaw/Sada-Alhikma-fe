import React, { createContext, useContext, useState } from "react";

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  // Get the token from localStorage if it exists
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Check if the user is authenticated
  const isAuthenticated = Boolean(token);

  // Login function to set the token
  const login = (token) => {
    setToken(token);
    localStorage.setItem("token", token);
  };

  // Logout function to remove the token
  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  // Provide the context values
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
