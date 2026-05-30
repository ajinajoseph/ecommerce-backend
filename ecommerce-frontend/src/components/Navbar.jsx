import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
  const { isAuthenticated, logout, role } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="logo-mark">SS</div>

        <div>
          <h1>ShopSphere</h1>
          {role && <p>Signed in as {role}</p>}
        </div>
      </div>

      <div className="navbar-links">
        <Link to="/">Products</Link>

        {isAuthenticated && (
          <>
            <Link to="/dashboard">Dashboard</Link>

            <button
              type="button"
              className="navbar-logout"
              onClick={logout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;