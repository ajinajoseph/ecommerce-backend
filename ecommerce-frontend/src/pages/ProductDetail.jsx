import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { resolveImageUrl } from "../utils/image";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' rx='40' fill='%23f5f3ff'/%3E%3Cpath d='M220 590L320 460l110 145 130-180 90 140' stroke='%239b8cff' stroke-width='34' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3Ccircle cx='300' cy='300' r='90' fill='%23e9ddff'/%3E%3C/svg%3E";

function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        setActiveImageIndex(0);
        setError("");
      } catch {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  const galleryImages = useMemo(() => {
    if (!product?.images?.length) {
      return [{ id: "placeholder", image_url: PLACEHOLDER_IMAGE, thumbnail_url: PLACEHOLDER_IMAGE }];
    }

    return product.images;
  }, [product]);

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];
  const mainImageUrl = resolveImageUrl(activeImage?.image_url || activeImage?.thumbnail_url || PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;

  function handlePrevious() {
    setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }

  function handleNext() {
    setActiveImageIndex((current) => (current + 1) % galleryImages.length);
  }

  function handleTouchStart(event) {
    setTouchStartX(event.touches[0].clientX);
  }

  function handleTouchEnd(event) {
    if (touchStartX === null) {
      return;
    }

    const delta = event.changedTouches[0].clientX - touchStartX;
    if (delta > 50) {
      handlePrevious();
    } else if (delta < -50) {
      handleNext();
    }

    setTouchStartX(null);
  }

  return (
    <div className="container">
      <Navbar />

      <section className="product-detail-page">
        <Link className="back-link" to="/">
          ← Back to shop
        </Link>

        {loading && (
          <div className="status-message loading-state">
            <p>Loading product…</p>
          </div>
        )}

        {error && (
          <div className="status-message error-state">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && product && (
          <div className="product-detail-card">
            <div
              className="product-gallery"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="product-gallery-main">
                {galleryImages.length > 1 && (
                  <button type="button" className="gallery-arrow gallery-arrow-left" onClick={handlePrevious}>
                    ←
                  </button>
                )}

                <img src={mainImageUrl} alt={product.name} />

                {galleryImages.length > 1 && (
                  <button type="button" className="gallery-arrow gallery-arrow-right" onClick={handleNext}>
                    →
                  </button>
                )}
              </div>

              <div className="product-thumbnails">
                {galleryImages.map((image, index) => {
                  const thumbnailUrl = resolveImageUrl(image?.thumbnail_url || image?.image_url || PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;
                  return (
                    <button
                      key={image.id || `${image.image_url}-${index}`}
                      type="button"
                      className={`product-thumbnail ${index === activeImageIndex ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img src={thumbnailUrl} alt={`${product.name} ${index + 1}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="product-details">
              <span className="eyebrow">Product details</span>
              <h1>{product.name}</h1>
              <p className="product-description">{product.description || "No description available yet."}</p>

              <div className="product-detail-meta">
                <div>
                  <span className="product-price">₹ {product.price}</span>
                  <span className={`product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>
                <span className="product-category">{product.category || "Uncategorized"}</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductDetail;
