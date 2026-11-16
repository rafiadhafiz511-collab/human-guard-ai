import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Devices from "../pages/Devices";
import Detections from "../pages/Detections";
import Settings from "../pages/Settings";

export const router = createBrowserRouter([
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
        path: "detections",
        element: <Detections />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);