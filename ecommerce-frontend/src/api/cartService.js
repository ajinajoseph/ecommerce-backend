import api from "./axios";

export function getCart() {
  return api.get("/cart");
}

export function addToCartApi(productId, quantity = 1) {
  return api.post("/cart/items", { product_id: productId, quantity });
}

export function updateCartItemApi(itemId, quantity) {
  return api.put(`/cart/items/${itemId}`, { quantity });
}

export function removeCartItemApi(itemId) {
  return api.delete(`/cart/items/${itemId}`);
}

export function checkoutApi() {
  return api.post("/checkout");
}
