function Filters({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <div className="filters">
      <button
        type="button"
        className={selectedCategory === "" ? "filter-button active" : "filter-button"}
        onClick={() => setSelectedCategory("")}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={selectedCategory === cat.id || selectedCategory === String(cat.id) ? "filter-button active" : "filter-button"}
          onClick={() => setSelectedCategory(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

export default Filters;