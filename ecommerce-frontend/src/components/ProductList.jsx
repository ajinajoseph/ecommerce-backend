import ProductCard from "./ProductCard";

function ProductList({ products }) {
  return (
    <div id="products" className="grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}

export default ProductList;