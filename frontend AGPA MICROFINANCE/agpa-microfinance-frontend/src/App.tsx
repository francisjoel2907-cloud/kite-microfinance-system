import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./pages/Dashboard/DashboardHome";
import Loans from "./pages/Dashboard/loans";
import Customers from "./pages/Dashboard/customers";
import Payments from "./pages/Dashboard/Payments";
import Reports from "./pages/Dashboard/reports";

import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* DASHBOARD ROUTES */}
      <Route
      path="/dashboard"
      element={
      <ProtectedRoute>
      <DashboardLayout />
      </ProtectedRoute>
      }
      >

        {/* dashboard home */}
        <Route index element={<DashboardHome />} />

        {/* payments */}
        <Route path="payments" element={<Payments />} />

        {/* loans */}
        <Route path="loans" element={<Loans />} />

        {/* customers */}
        <Route path="customers" element={<Customers />} />

        {/* reports */}
        <Route path="reports" element={<Reports />} />

      </Route>

      {/* fallback */}
      <Route path="*" element={<Landing />} />

    </Routes>
  );
}

export default App;