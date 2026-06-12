function SearchBar({ search, setSearch }) {
  return (
    <div className="search-input-wrapper">
      <span className="search-icon" aria-hidden="true">🔍︎</span>
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />
    </div>
  );
}

export default SearchBar;