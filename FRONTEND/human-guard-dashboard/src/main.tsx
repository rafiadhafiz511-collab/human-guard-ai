import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { HomeProvider } from "./contexts/HomeContext";
import AppRouter from "./router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <HomeProvider>
          <AppRouter />
        </HomeProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);