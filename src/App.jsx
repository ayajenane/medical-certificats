import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pilots from "./pages/Pilots";
import History from "./pages/History";
import Certificates from "./pages/Certificates";
import AdminManagement from "./pages/AdminManagement";
import AdminHistory from "./pages/AdminHistory";
import Profile from "./pages/Profile";
import Pdf1 from "./components/Pdf1";
import Pdf2 from "./components/Pdf2";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";

function isAuthenticated() {
  return !!sessionStorage.getItem("currentUser");
}

function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

function GuestRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function SuperAdminRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (user.role !== "superadmin") return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/admin-management" element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
          <Route path="/admin-history" element={<SuperAdminRoute><AdminHistory /></SuperAdminRoute>} />
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pilots"    element={<ProtectedRoute><Pilots /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/pdf1"      element={<ProtectedRoute><Pdf1 /></ProtectedRoute>} />
          <Route path="/pdf2"      element={<ProtectedRoute><Pdf2 /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
