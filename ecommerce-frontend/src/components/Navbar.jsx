import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../auth/AuthContext";
import { fetchCart, clearCart } from "../redux/cartSlice";

function Navbar() {
  const { isAuthenticated, logout: authLogout, role } = useAuth();
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (isAuthenticated && role !== "admin") {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, role]);

  const handleLogout = async () => {
    dispatch(clearCart());
    await authLogout();
  };

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
