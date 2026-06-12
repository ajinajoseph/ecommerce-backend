import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCart,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  checkoutApi
} from "../api/cartService";

const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem("cart_items");
    const savedTotal = localStorage.getItem("cart_total");
    return {
      items: savedCart ? JSON.parse(savedCart) : [],
      totalAmount: savedTotal ? parseFloat(savedTotal) : 0,
      loading: false,
      error: null,
    };
  } catch {
    return {
      items: [],
      totalAmount: 0,
      loading: false,
      error: null,
    };
  }
};

const saveCartToStorage = (items, totalAmount) => {
  try {
    localStorage.setItem("cart_items", JSON.stringify(items));
    localStorage.setItem("cart_total", totalAmount.toString());
  } catch (error) {
    console.error("Could not save cart to local storage", error);
  }
};

const clearCartFromStorage = () => {
  try {
    localStorage.removeItem("cart_items");
    localStorage.removeItem("cart_total");
  } catch (error) {
    console.error("Could not clear cart from local storage", error);
  }
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCart();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch cart");
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity }, { dispatch, rejectWithValue }) => {
    try {
      await addToCartApi(productId, quantity);
      dispatch(fetchCart());
      return { productId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to add item to cart");
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity }, { dispatch, rejectWithValue }) => {
    try {
      await updateCartItemApi(itemId, quantity);
      dispatch(fetchCart());
      return { itemId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to update item");
    }
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (itemId, { dispatch, rejectWithValue }) => {
    try {
      await removeCartItemApi(itemId);
      dispatch(fetchCart());
      return itemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to remove item");
    }
  }
);

export const checkoutCart = createAsyncThunk(
  "cart/checkoutCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await checkoutApi();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to checkout");
    }
  }
);

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.loading = false;
      state.error = null;
      clearCartFromStorage();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalAmount = action.payload.total_amount || 0;
        saveCartToStorage(state.items, state.totalAmount);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Checkout
      .addCase(checkoutCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalAmount = 0;
        clearCartFromStorage();
      })
      .addCase(checkoutCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
