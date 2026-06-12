import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { useAuth } from "../auth/AuthContext";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { role } = useAuth();

  const thumbnailUrl = product.images?.[0]?.thumbnail_url;
  const imageUrl = thumbnailUrl
    ? thumbnailUrl.startsWith("http")
      ? thumbnailUrl
      : `http://127.0.0.1:5000${thumbnailUrl}`
    : "/placeholder.png";

  const handleAddToCart = async () => {
    try {
      const resultAction = await dispatch(addToCart({ productId: product.id, quantity: 1 }));
      if (addToCart.fulfilled.match(resultAction)) {
        alert("Item added to cart!");
      } else {
        alert(resultAction.payload || "Failed to add item to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  return (
    <article className="card">
      <div className="card-image">
        <img
          src={imageUrl}
          alt={product.name}
        />
      </div>

      <div className="card-content">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="price-row" style={{ marginTop: "16px" }}>
          <span className="price">₹ {product.price}</span>
          {role !== "admin" && (
            <button
              type="button"
              className="admin-primary-button"
              style={{
                padding: "10px 18px",
                fontSize: "0.9rem",
                borderRadius: "14px",
                marginTop: "0",
                background: product.stock <= 0 ? "#6b7280" : "linear-gradient(135deg, #8b5cf6, #ec4899)",
                cursor: product.stock <= 0 ? "not-allowed" : "pointer"
              }}
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;