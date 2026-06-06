import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";

function Dashboard() {
  const { role, loading: authLoading, username, email } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [stats, setStats] = useState({ totalProducts: 0, totalCategories: 0 });

 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 8;

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);


  const clearFileState = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl("");
  }, [previewUrl]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data);
      setStats((prev) => ({ ...prev, totalCategories: response.data.length }));
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

 
  const fetchProducts = useCallback(async (pageNum = 1) => {
    try {
      setLoadingProducts(true);
      const response = await api.get("/products", {
        params: {
          page: pageNum,
          per_page: perPage,
        },
      });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.total_pages);
      setTotalItems(response.data.pagination.total_items);
      setStats((prev) => ({ ...prev, totalProducts: response.data.pagination.total_items }));
    } catch (err) {
      setErrorMsg("Failed to load products.");
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);


  useEffect(() => {
    if (role === "admin") {
      fetchCategories();
      fetchProducts(page);
    }
  }, [role, page, fetchCategories, fetchProducts]);

  async function handleAddCategory(e) {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;

    try {
      setIsAddingCategory(true);
      setErrorMsg("");
      await api.post("/categories", { name: catName });
      setNewCategoryName("");
      setSuccessMsg(`Category "${catName}" added successfully.`);
      fetchCategories();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error || "Failed to create category."
      );
    } finally {
      setIsAddingCategory(false);
    }
  }

  function handleOpenAdd() {
    setEditProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategoryId(categories[0]?.id || "");
    clearFileState();
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(product) {
    setEditProduct(product);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price || "");
    setStock(product.stock || "");
    setCategoryId(product.category_id || "");
    clearFileState();
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Only JPG, PNG, GIF, and WEBP images are allowed.");
      return;
    }

    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 5MB.");
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

 
  function handleRemoveFile() {
    clearFileState();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }
    if (parseFloat(price) < 0 || parseInt(stock) < 0) {
      setErrorMsg("Price and stock cannot be negative.");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Please select a category.");
      return;
    }

    try {
      setIsSaving(true);
      let productId = null;
      let msg = "";

      const productPayload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: parseInt(categoryId),
      };

      if (!editProduct) {
        const response = await api.post("/products", productPayload);
        productId = response.data.product.id;
        msg = `Product "${name}" created successfully.`;
      } else {
        productId = editProduct.id;
        await api.put(`/products/${productId}`, productPayload);
        msg = `Product "${name}" updated successfully.`;
      }
      if (selectedImage && productId) {
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("images", selectedImage);

        await api.post(`/products/${productId}/images`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        });
      }

      setSuccessMsg(msg);
      setIsModalOpen(false);
      clearFileState();
      fetchProducts(page);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error || "An error occurred while saving the product."
      );
      console.error(err);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function handleDeleteClick(product) {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setSuccessMsg(`Product "${productToDelete.name}" deleted successfully.`);
      setIsDeleteConfirmOpen(false);
      setProductToDelete(null);
      
      const updatedTotalItems = totalItems - 1;
      const updatedTotalPages = Math.ceil(updatedTotalItems / perPage) || 1;
      if (page > updatedTotalPages) {
        setPage(updatedTotalPages);
      } else {
        fetchProducts(page);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error || "Failed to delete product."
      );
      setIsDeleteConfirmOpen(false);
    }
  }

  function getProductImageUrl(product) {
    const thumbnailUrl = product.images?.[0]?.thumbnail_url;
    if (!thumbnailUrl) return "";
    if (thumbnailUrl.startsWith("http")) return thumbnailUrl;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api").replace(/\/api$/, "");
    return `${baseUrl}${thumbnailUrl.startsWith("/") ? "" : "/"}${thumbnailUrl}`;
  }

  function formatBytes(bytes, decimals = 2) {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  if (authLoading) {
    return (
      <div className="status-message loading-state">
        <p>Checking session...</p>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="container">
        <Navbar />
        <div className="status-message error-state" style={{ minHeight: "50vh" }}>
          <h2 style={{ color: "#111827" }}>My Account</h2>
          <p style={{ margin: "12px 0 18px", color: "#4b5563" }}>
            You do not have access to the admin dashboard. Here is your account information.
          </p>
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              margin: "0 auto 24px",
              padding: "22px",
              borderRadius: "20px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              color: "#111827",
              textAlign: "left",
            }}
          >
            <p style={{ margin: 0, lineHeight: 1.8 }}>
              <strong>Username:</strong> {username || "Not available"}
            </p>
            <p style={{ margin: "8px 0 0", lineHeight: 1.8 }}>
              <strong>Email:</strong> {email || "Not available"}
            </p>
            <p style={{ margin: "8px 0 0", lineHeight: 1.8 }}>
              <strong>Role:</strong> {role || "User"}
            </p>
          </div>
          <Link to="/" className="btn btn-primary">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar />

      <div className="admin-dashboard">
        {/* Alerts */}
        {successMsg && (
          <div className="alert-bar success">
            <span>{successMsg}</span>
            <button className="close-btn" style={{ fontSize: "1.2rem", width: "24px", height: "24px" }} onClick={() => setSuccessMsg("")}>×</button>
          </div>
        )}
        {errorMsg && !isModalOpen && (
          <div className="alert-bar error">
            <span>{errorMsg}</span>
            <button className="close-btn" style={{ fontSize: "1.2rem", width: "24px", height: "24px" }} onClick={() => setErrorMsg("")}>×</button>
          </div>
        )}

        <div className="dashboard-header">
          <div>
            <h2>Product Administration</h2>
            <p style={{ color: "#6d5d7a", margin: "4px 0 0" }}>
              Manage your product catalog, add items, edit info, and configure uploads.
            </p>
          </div>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              Add New Product
            </button>
          </div>
        </div>
        <div className="search-filters" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
          <div className="price-filter" style={{ borderRadius: "20px", width: "100%", justifyContent: "flex-start", gap: "12px" }}>
            <span className="price-input-label" style={{ minWidth: "110px" }}>Quick Category:</span>
            <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "8px", flex: 1 }}>
              <input
                type="text"
                className="price-input"
                style={{ flex: 1, width: "auto" }}
                placeholder="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isAddingCategory}
                required
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: "8px 14px" }} disabled={isAddingCategory}>
                {isAddingCategory ? "Adding..." : "Add"}
              </button>
            </form>
          </div>

        
          <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <div className="filter-button" style={{ cursor: "default", background: "white", boxShadow: "var(--shadow)" }}>
              Products: <strong style={{ color: "#8b5cf6" }}>{stats.totalProducts}</strong>
            </div>
            <div className="filter-button" style={{ cursor: "default", background: "white", boxShadow: "var(--shadow)" }}>
              Categories: <strong style={{ color: "#ec4899" }}>{stats.totalCategories}</strong>
            </div>
          </div>
        </div>

        {loadingProducts ? (
          <div className="status-message loading-state" style={{ minHeight: "30vh" }}>
            <p>Loading catalog products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p style={{ margin: "8px 0 16px" }}>Your catalog is empty. Click "Add New Product" to start building your shop.</p>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              Add First Product
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imgUrl = getProductImageUrl(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        {imgUrl ? (
                          <img src={imgUrl} alt={product.name} className="product-thumb" />
                        ) : (
                          <div className="product-thumb" style={{ display: "grid", placeItems: "center", fontSize: "0.7rem", color: "#9ca3af", fontStyle: "italic" }}>
                            No Image
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: "#111827" }}>{product.name}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#6d5d7a", marginTop: "4px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.description || "No description provided."}
                        </div>
                      </td>
                      <td>
                        <span className="code" style={{ fontSize: "0.8rem", background: "var(--accent-bg)", color: "#111827", border: "1px solid var(--accent-border)", padding: "2px 6px" }}>
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <strong>₹ {product.price}</strong>
                      </td>
                      <td>
                        <span style={{ color: product.stock === 0 ? "#ef4444" : "#111827", fontWeight: product.stock === 0 ? "700" : "500" }}>
                          {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(product)}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(product)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                <div className="pagination">
                  <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                    ←
                  </button>
                  <span style={{ fontWeight: 600, color: "var(--text-h)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal-content">
            <div className="modal-header">
              <h3>{editProduct ? "Edit Product" : "Add New Product"}</h3>
              <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Form Alerts */}
              {errorMsg && (
                <div className="alert-bar error" style={{ padding: "10px 14px", fontSize: "0.85rem", margin: 0 }}>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="prod-name">Product Name</label>
                <input
                  id="prod-name"
                  type="text"
                  className="form-input"
                  placeholder="Enter product title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-desc">Description</label>
                <textarea
                  id="prod-desc"
                  className="form-textarea"
                  placeholder="Describe the product details, specs, sizes, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prod-price">Price (₹)</label>
                  <input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prod-stock">Stock Quantity</label>
                  <input
                    id="prod-stock"
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prod-category">Category</label>
                <select
                  id="prod-category"
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                
                {!previewUrl ? (
                  <div className="form-file-input">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <div className="file-input-text">
                      <span>Drag & drop or <strong>click to browse</strong></span>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                        Supports JPEG, PNG, GIF, WEBP (Max 5MB)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <img src={previewUrl} alt="Preview" className="image-preview" />
                    <div className="image-preview-info">
                      <span className="file-name">{selectedImage?.name}</span>
                      <span className="file-size">{formatBytes(selectedImage?.size)}</span>
                    </div>
                    <button type="button" className="remove-img-btn" onClick={handleRemoveFile}>
                      Remove
                    </button>
                  </div>
                )}

                {isUploading && (
                  <div className="upload-progress-section">
                    <div className="progress-header">
                      <span>Uploading Image...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? (isUploading ? "Uploading..." : "Saving...") : (editProduct ? "Update Product" : "Create Product")}
              </button>
            </div>
          </form>
        </div>
      )}

     
      {isDeleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <div className="modal-header" style={{ background: "rgba(239, 68, 68, 0.02)" }}>
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setIsDeleteConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete product <strong>{productToDelete?.name}</strong>?</p>
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "4px" }}>
                This action is permanent and will delete the product catalog item and any associated media files.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
