import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  checkoutCart
} from "../redux/cartSlice";

function CartDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { items, totalAmount, loading, error } = useSelector((state) => state.cart);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCheckoutSuccess(false);
      setOrderInfo(null);
      dispatch(fetchCart());
    }
  }, [isOpen, dispatch]);

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

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-drawer-header">
          <h2>Your Shopping Cart</h2>
          <button type="button" className="cart-drawer-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="login-alert error">{error}</div>}

        {checkoutSuccess ? (
          <div className="checkout-success-view">
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
              <div className="order-details-box">
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
            <button
              type="button"
              className="admin-primary-button continue-shopping-btn"
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-body">
              {loading && items.length === 0 ? (
                <div className="cart-loading">
                  <p>Updating cart...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="cart-empty-view">
                  <div className="cart-empty-icon">🛒</div>
                  <p className="empty-title">Your cart is empty</p>
                  <p className="empty-subtitle">Discover trending styles and fill it up!</p>
                  <button
                    type="button"
                    className="admin-primary-button"
                    style={{ marginTop: "24px" }}
                    onClick={onClose}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="cart-items-list">
                  {items.map((item) => {
                    return (
                      <div key={item.id} className="cart-item-card">
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
              )}
            </div>

            {items.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span className="cart-total-amount">₹ {totalAmount}</span>
                </div>
                <p className="cart-footer-notes">Taxes and shipping calculated at checkout.</p>
                
                <button
                  type="button"
                  className="admin-primary-button checkout-btn"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Place Order & Checkout"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
