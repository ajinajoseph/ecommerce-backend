import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductForm from "../components/ProductForm";
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
  uploadProductImages,
  createCategory,
} from "../api/productService";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetchProducts({ page: 1, per_page: 100, sort_by: "newest", order: "desc" }),
        fetchCategories(),
      ]);

      setProducts(productsResponse.data.products);
      setCategories(categoriesResponse.data);
      setError("");
    } catch {
      setError("Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  function openAddForm() {
    setFormMode("add");
    setEditingProduct(null);
  }

  function openEditForm(product) {
    setFormMode("edit");
    setEditingProduct(product);
  }

  function openAddCategoryForm() {
    setFormMode("category");
    setCategoryName("");
    setCategoryError("");
  }

  function closeForm() {
    setFormMode(null);
    setEditingProduct(null);
    setUploadProgress(0);
    setIsUploading(false);
    setCategoryName("");
    setCategoryError("");
  }

  async function handleProductSubmit(productData, selectedFiles) {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let productId;

      if (formMode === "edit" && editingProduct) {
        const response = await updateProduct(editingProduct.id, productData);
        productId = response.data.product.id;
      } else {
        const response = await createProduct(productData);
        productId = response.data.product.id;
      }

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        await uploadProductImages(productId, selectedFiles, setUploadProgress);
      }

      await loadDashboardData();
      closeForm();
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError("Category name is required.");
      return;
    }
    setIsSubmitting(true);
    setCategoryError("");
    try {
      await createCategory({ name: categoryName.trim() });
      await loadDashboardData();
      closeForm();
    } catch (err) {
      setCategoryError(err.response?.data?.error || "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This will also remove its images.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);
      await loadDashboardData();
    } catch (deleteError) {
      setError(
        deleteError.response?.data?.error || "Failed to delete product."
      );
    }
  }

  return (
    <div className="container">
      <Navbar />

      <section className="hero admin-hero">
        <div className="hero-copy">
          <span className="eyebrow">Admin</span>
          <h1>Product dashboard</h1>
          <p className="hero-text">
            Add, edit, and delete products with image uploads and live preview.
          </p>
        </div>
      </section>

      <div className="admin-toolbar">
        <h2>Products ({products.length})</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" className="admin-primary-button" onClick={openAddCategoryForm}>
            Add category
          </button>
          <button type="button" className="admin-primary-button" onClick={openAddForm}>
            Add product
          </button>
        </div>
      </div>

      {error && <div className="login-alert error">{error}</div>}

      {formMode && formMode !== "category" && (
        <ProductForm
          mode={formMode}
          categories={categories}
          initialProduct={editingProduct}
          onSubmit={handleProductSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />
      )}

      {formMode === "category" && (
        <form className="product-form" onSubmit={handleCategorySubmit}>
          <div className="product-form-header">
            <h2>Add category</h2>
            <button type="button" className="form-cancel-button" onClick={closeForm}>
              Cancel
            </button>
          </div>

          {categoryError && <div className="login-alert error">{categoryError}</div>}

          <label className="login-field">
            Category Name
            <input
              name="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Electronics, Clothing..."
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create category"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="status-message loading-state">
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No products yet. Add your first product.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const thumbnail = product.images?.[0]?.thumbnail_url;

                  return (
                    <tr key={product.id}>
                      <td>
                        {thumbnail ? (
                          <img
                            className="admin-thumb"
                            src={thumbnail}
                            alt={product.name}
                          />
                        ) : (
                          <span className="admin-no-image">No image</span>
                        )}
                      </td>
                      <td>{product.name}</td>
                      <td>{product.category || "—"}</td>
                      <td>₹ {product.price}</td>
                      <td>{product.stock}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-edit-button"
                            onClick={() => openEditForm(product)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-delete-button"
                            onClick={() => handleDelete(product)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
