import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Devices from "../pages/Devices";
import Rooms from "../pages/Rooms";
import Schedules from "../pages/Schedules";
import Activity from "../pages/Activity";
import Settings from "../pages/Settings";
import Login from "../pages/Login";

import ProtectedRoute from "./ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "devices",
            element: <Devices />,
          },
          {
            path: "rooms",
            element: <Rooms />,
          },
          {
            path: "schedules",
            element: <Schedules />,
          },
          {
            path: "activity",
            element: <Activity />,
          },
          {
            path: "analytics",
            element: <Dashboard />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}