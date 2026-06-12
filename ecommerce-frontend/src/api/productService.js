import api from "./axios";

export function fetchProducts(params = {}) {
  return api.get("/products", { params });
}

export function fetchCategories() {
  return api.get("/categories");
}

export function createProduct(data) {
  return api.post("/products", data);
}

export function updateProduct(productId, data) {
  return api.put(`/products/${productId}`, data);
}

export function deleteProduct(productId) {
  return api.delete(`/products/${productId}`);
}

export function createCategory(data) {
  return api.post("/categories", data);
}

export function uploadProductImages(productId, files, onProgress) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  return api.post(`/products/${productId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
}
