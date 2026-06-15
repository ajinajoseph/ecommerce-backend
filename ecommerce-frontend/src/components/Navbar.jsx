import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../auth/AuthContext";
import { fetchCart, clearCart } from "../redux/cartSlice";

function Navbar() {
  const { isAuthenticated, logout: authLogout, role, username, email } = useAuth();
  const dispatch = useDispatch();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const cartItems = useSelector((state) => state.cart.items);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const avatarLetter = isAuthenticated
    ? (username || role || "U").charAt(0).toUpperCase()
    : "SS";

  useEffect(() => {
    if (isAuthenticated && role !== "admin") {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, role]);

  useEffect(() => {
    if (!showUserMenu) {
      return;
    }

    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    dispatch(clearCart());
    await authLogout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" ref={userMenuRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="logo-mark"
          onClick={() => isAuthenticated && setShowUserMenu((open) => !open)}
          style={{
            border: "none",
            cursor: isAuthenticated ? "pointer" : "default",
            padding: 0,
          }}
          aria-label={isAuthenticated ? "View user details" : "ShopSphere logo"}
          aria-expanded={showUserMenu}
        >
          {avatarLetter}
        </button>

        <div>
          <h1>ShopSphere</h1>
          {role && <p>Signed in as {role}</p>}
        </div>

        {isAuthenticated && showUserMenu && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              minWidth: "220px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.98)",
              boxShadow: "0 18px 40px rgba(139, 92, 246, 0.18)",
              zIndex: 20,
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#7b6f8b" }}>
              Username
            </p>
            <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#1f1630" }}>
              {username || "—"}
            </p>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#7b6f8b" }}>
              Email
            </p>
            <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#1f1630", wordBreak: "break-word" }}>
              {email || "—"}
            </p>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#7b6f8b" }}>
              Role
            </p>
            <p style={{ margin: 0, fontWeight: 600, color: "#1f1630", textTransform: "capitalize" }}>
              {role || "—"}
            </p>
          </div>
        )}
      </div>

      <div className="navbar-links">
        {isAuthenticated && (
          <>
            {role === "admin" && (
              <Link to="/dashboard" className="navbar-pill-link">
                Dashboard
              </Link>
            )}

            <Link to="/" className="navbar-pill-link">
              Products
            </Link>

            {role !== "admin" && (
              <Link to="/cart" className="navbar-pill-link">
                <span>🛒 Cart</span>
                {totalCount > 0 && (
                  <span
                    style={{
                      background: "#ec4899",
                      color: "white",
                      borderRadius: "50%",
                      minWidth: "20px",
                      height: "20px",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      padding: "0 4px"
                    }}
                  >
                    {totalCount}
                  </span>
                )}
              </Link>
            )}

            <button
              type="button"
              className="navbar-logout"
              onClick={handleLogout}
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
