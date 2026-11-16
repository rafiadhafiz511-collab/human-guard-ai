import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout() {
  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Header />

        <main className="p-8 flex-1">
          <Outlet />
        </main>

      </div>
    </div>
  );
}