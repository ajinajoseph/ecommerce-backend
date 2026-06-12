function PriceFilter({ minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  return (
    <div className="price-filter">
      <label className="price-input-label">
        Min Price: ₹
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="0"
          min="0"
          className="price-input"
        />
      </label>
      <label className="price-input-label">
        Max Price: ₹
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="10000"
          min="0"
          className="price-input"
        />
      </label>
    </div>
  );
}

export default PriceFilter;
