
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Rooms from "./pages/Rooms";
import Schedules from "./pages/Schedules";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";

import Detections from "./components/Detections";

import { AuthProvider } from "./contexts/AuthContext";
import { HomeProvider } from "./contexts/HomeContext";

export default function App() {
  return (
    <AuthProvider>
      <HomeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />

              <Route
                path="devices"
                element={<Devices />}
              />

              <Route
                path="rooms"
                element={<Rooms />}
              />

              <Route
                path="schedules"
                element={<Schedules />}
              />

              <Route
                path="activity"
                element={<Activity />}
              />

              <Route
                path="settings"
                element={<Settings />}
              />

              <Route
                path="detections"
                element={<Detections />}
              />

              <Route
                path="analytics"
                element={<Dashboard />}
              />

              {/* Redirect unknown paths to dashboard */}
              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </HomeProvider>
    </AuthProvider>
  );
}

