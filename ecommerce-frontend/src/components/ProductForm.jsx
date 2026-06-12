import { useEffect, useState } from "react";
import ImageUpload from "./ImageUpload";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
};

function ProductForm({
  mode,
  categories,
  initialProduct,
  onSubmit,
  onCancel,
  isSubmitting,
  uploadProgress,
  isUploading,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && initialProduct) {
      setForm({
        name: initialProduct.name || "",
        description: initialProduct.description || "",
        price: String(initialProduct.price ?? ""),
        stock: String(initialProduct.stock ?? ""),
        category_id: String(initialProduct.category_id ?? ""),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setSelectedFiles([]);
    setError("");
  }, [mode, initialProduct]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      setError("Enter a valid stock quantity.");
      return;
    }

    try {
      await onSubmit(
        {
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          stock,
          category_id: Number(form.category_id),
        },
        selectedFiles
      );
    } catch (submitError) {
      setError(
        submitError.response?.data?.error ||
          submitError.message ||
          "Failed to save product."
      );
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="product-form-header">
        <h2>{mode === "edit" ? "Edit product" : "Add product"}</h2>
        <button type="button" className="form-cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <div className="login-alert error">{error}</div>}

      <label className="login-field">
        Name
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          disabled={isSubmitting}
        />
      </label>

      <label className="login-field">
        Description
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Product description"
          rows={4}
          disabled={isSubmitting}
        />
      </label>

      <div className="product-form-row">
        <label className="login-field">
          Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </label>

        <label className="login-field">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={handleChange}
            placeholder="0"
            disabled={isSubmitting}
          />
        </label>
      </div>

      <label className="login-field">
        Category
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <ImageUpload
        selectedFiles={selectedFiles}
        onFilesChange={setSelectedFiles}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        existingImages={mode === "edit" ? initialProduct?.images || [] : []}
      />

      <button
        type="submit"
        className="login-button"
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting || isUploading
          ? "Saving..."
          : mode === "edit"
            ? "Update product"
            : "Create product"}
      </button>
    </form>
  );
}

export default ProductForm;
