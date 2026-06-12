import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  checkoutCart
} from "../redux/cartSlice";

function Cart() {
  const dispatch = useDispatch();
  const { items, totalAmount, loading, error } = useSelector((state) => state.cart);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleQuantityChange = (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    dispatch(updateCartItem({ itemId: item.id, quantity: newQty }));
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm("Remove this item from your cart?")) {
      dispatch(removeCartItem(itemId));
    }
  };

  const handleCheckout = async () => {
    try {
      const resultAction = await dispatch(checkoutCart());
      if (checkoutCart.fulfilled.match(resultAction)) {
        setOrderInfo(resultAction.payload);
        setCheckoutSuccess(true);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  return (
    <div className="container">
      <Navbar />

      <div className="cart-page-wrapper">
        {error && <div className="login-alert error" style={{ margin: "20px 0" }}>{error}</div>}

        {checkoutSuccess ? (
          <div className="checkout-success-view-full">
            <div className="success-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="success-check-svg"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3>Order Placed Successfully!</h3>
            <p className="success-msg">
              {orderInfo?.message || "Thank you for shopping with ShopSphere. Your order has been registered."}
            </p>
            {orderInfo?.order_id && (
              <div className="order-details-box" style={{ maxWidth: "480px", margin: "0 auto 32px" }}>
                <div className="order-detail-row">
                  <span>Order ID:</span>
                  <strong>#{orderInfo.order_id}</strong>
                </div>
                <div className="order-detail-row">
                  <span>Total Paid:</span>
                  <strong>₹ {orderInfo.total_amount}</strong>
                </div>
              </div>
            )}
            <Link
              to="/"
              className="admin-primary-button continue-shopping-btn"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "280px",
                margin: "0 auto"
              }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="cart-loading" style={{ minHeight: "400px" }}>
            <p>Loading your cart...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty-view" style={{ minHeight: "400px" }}>
            <div className="cart-empty-icon">🛒</div>
            <p className="empty-title">Your cart is empty</p>
            <p className="empty-subtitle">Discover trending styles and fill it up!</p>
            <Link
              to="/"
              className="admin-primary-button"
              style={{
                marginTop: "24px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px"
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-page-container">
            <div className="cart-page-main">
              <div className="cart-header-row">
                <h2>Shopping Cart</h2>
                <span className="cart-item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
              </div>

              <div className="cart-items-list">
                {items.map((item) => {
                  const thumbnailUrl = item.thumbnail_url;
                  const imageUrl = thumbnailUrl
                    ? thumbnailUrl.startsWith("http")
                      ? thumbnailUrl
                      : `http://127.0.0.1:5000${thumbnailUrl}`
                    : "/placeholder.png";

                  return (
                    <div key={item.id} className="cart-item-card">
                      <div className="cart-item-image-wrapper">
                        <img
                          src={imageUrl}
                          alt={item.product_name}
                          className="cart-item-image"
                        />
                      </div>
                      
                      <div className="cart-item-details">
                        <h4>{item.product_name}</h4>
                        <span className="cart-item-price">₹ {item.price}</span>
                        
                        <div className="cart-item-actions">
                          <div className="quantity-controls">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={item.quantity <= 1 || loading}
                            >
                              &minus;
                            </button>
                            <span className="qty-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={loading}
                            >
                              &#43;
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            className="cart-remove-btn"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-total">
                        ₹ {item.line_total}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "24px", textAlign: "left" }}>
                <Link to="/" className="back-to-shop-link">
                  &larr; Back to Shopping
                </Link>
              </div>
            </div>

            <div className="cart-page-summary">
              <div className="cart-summary-card">
                <h3>Order Summary</h3>
                
                <div className="summary-details">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <strong>₹ {totalAmount}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="free-shipping">FREE</span>
                  </div>
                  <div className="summary-row">
                    <span>Estimated Tax</span>
                    <span>₹ 0</span>
                  </div>
                  <hr className="summary-divider" />
                  <div className="summary-row total-row">
                    <span>Total</span>
                    <span className="cart-total-amount">₹ {totalAmount}</span>
                  </div>
                </div>

                <p className="cart-footer-notes">Shipping and taxes will be computed checkout.</p>

                <button
                  type="button"
                  className="admin-primary-button checkout-btn"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Place Order & Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
