import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function AdminRoute({ children }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="status-message loading-state">
        <p>Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
