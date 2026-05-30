import { useEffect, useState } from "react";
import api from "../api/axios";

import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import Filters from "../components/Filters";
import PriceFilter from "../components/PriceFilter";
import ProductList from "../components/ProductList";
import Pagination from "../components/Pagination";

function Home() {

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, minPrice, maxPrice, page]);

  async function fetchProducts() {
    try {
      setLoading(true);

      const response = await api.get("/api/products", {
        params: {
          search: search,
          category_id: selectedCategory,
          min_price: minPrice,
          max_price: maxPrice,
          page: page,
          per_page: 6,
        },
      });

      setProducts(response.data.products);
      setTotalPages(response.data.pagination.total_pages);
      setError("");
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="container">
      <Navbar />

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Modern shopping, made simple</span>
          <h1>ShopSphere — curated products for every style.</h1>
          <p className="hero-text">
            Discover trending products with smart search, clean filters, and
            a polished shopping experience.
          </p>
        </div>
      </section>

      <div className="search-filters">
        <SearchBar search={search} setSearch={setSearch} />
        <Filters
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <PriceFilter
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />
      </div>

      {loading && (
        <div className="status-message loading-state">
          <p>Loading products…</p>
        </div>
      )}

      {error && (
        <div className="status-message error-state">
          <p>{error}</p>
        </div>
      )}

      <ProductList products={products} />

      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  );
}

export default Home;