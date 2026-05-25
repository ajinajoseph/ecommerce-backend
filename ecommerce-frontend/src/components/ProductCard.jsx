function ProductCard({ product }) {
  const thumbnailUrl = product.images?.[0]?.thumbnail_url;
  const imageUrl = thumbnailUrl
    ? thumbnailUrl.startsWith("http")
      ? thumbnailUrl
      : `http://127.0.0.1:5000${thumbnailUrl}`
    : "/placeholder.png";

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
        <div className="price-row">
          <span className="price">₹ {product.price}</span>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;