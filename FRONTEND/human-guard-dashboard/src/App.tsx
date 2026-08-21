import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Schedules from "./pages/Schedules";
import Activity from "./pages/Activity"; // 👈 আপনার Activity পেজ
import Settings from "./pages/Settings";
import Detections from "./components/Detections";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="detections" element={<Detections />} />
          <Route path="analytics" element={<Dashboard />} />
          {/* রিডাইরেক্ট যাতে ভুল পাথে গেলে ড্যাশবোর্ডে নিয়ে যায় */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
