import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pilots from "./pages/Pilots";
import History from "./pages/History";
import Pdf1 from "./components/Pdf1";

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<SuperAdminRoute><Register /></SuperAdminRoute>} />
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pilots"    element={<ProtectedRoute><Pilots /></ProtectedRoute>} />
        <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/pdf1"      element={<ProtectedRoute><Pdf1 /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
