import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./AppLayout";
import Home from "./Components/Home";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Clients from "./Components/Clients";
import Client from "./Components/Clients/Client";
import Trips from "./Components/Trips";
import TripPage from "./Components/Trips/Trip";
import InvoicePage from "./Components/Invoices";
import ClientsByReturnDateAndLocation from "./Components/Returns";
import Accommodation from "./Components/Accommodation";
import MadinaTrips from "./Components/MadinaTrips";
import TripInvoicePage from "./Components/Invoices/TripInvoicePage";

import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "./Contexts/AuthContext";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        element: <ProtectedRoute />, // Protect all child routes
        children: [
          { index: true, element: <Trips /> },
          { path: "/trips", element: <Trips /> },
          { path: "/trip/:tripId", element: <TripPage /> },
          { path: "/invoice/", element: <InvoicePage /> },
          { path: "/returns/", element: <ClientsByReturnDateAndLocation /> },
          { path: "/accommodation/", element: <Accommodation /> },
          { path: "/city-trips/", element: <MadinaTrips /> },
          { path: "/clients", element: <Clients /> },
          { path: "/client/:id", element: <Client /> },
        ],
      },
      // Unprotected routes
    ],
  },
  {
    path: "/register",
    element: <Register />,
  },

  { path: "/login", element: <Login /> },
  { path: "*", element: <h1>Page Not Found</h1> }, // 404 page
]);

function App() {
  return (
    <div dir="rtl">
      <AuthProvider>
        <Toaster />
        <RouterProvider router={routes} />
      </AuthProvider>
    </div>
  );
}

export default App;
