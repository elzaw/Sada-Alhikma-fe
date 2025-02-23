import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Home from "./Components/Home";
import { Toaster } from "react-hot-toast";
import Clients from "./Components/Clients";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./AppLayout";
import Client from "./Components/Clients/Client";
import Trips from "./Components/Trips";
import TripPage from "./Components/Trips/Trip";
import InvoicePage from "./Components/Invoices";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,

    children: [
      { index: true, element: <Home /> },
      { path: "/about", element: <h1>About Us</h1> },
      { path: "/contact", element: <h1>Contact Us</h1> },
      { path: "/trips", element: <Trips /> },
      { path: "/trip/:tripId", element: <TripPage /> },
      { path: "/invoice/", element: <InvoicePage /> },

      { path: "/clients", element: <Clients /> },
      { path: "/client/:id", element: <Client /> },

      { path: "*", element: <h1>Page Not Found</h1> },
    ],
  },
  { path: "/register", element: <Register /> },
  { path: "/login", element: <Login /> },
]);
function App() {
  return (
    <div dir="rtl">
      <Toaster />
      <RouterProvider router={routes} />
    </div>
  );
}

export default App;
