import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cart: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      // newItem = action.payload
      state.cart.push(action.payload);
    },
    deleteItem(state, action) {
      // itemID = action.payload
      state.cart = state.cart.filter((item) => item.pizzaId !== action.payload);
    },
    increaseItemQuality(state, action) {
      // itemID = action.payload

      const item = state.cart.find((item) => item.pizzaId === action.payload);
      item.quantity++;
      item.totalPrice = item.quantity * item.unitPrice;
    },
    decreaseItemQuality(state, action) {
      // itemID = action.payload

      const item = state.cart.find((item) => item.pizzaId === action.payload);
      item.totalPrice = item.quantity * item.unitPrice;
      item.quantity--;
      if (item.quantity === 0) cartSlice.caseReducers.deleteItem(state, action);
    },
    clearCart(state) {
      state.cart = [];
    },
  },
});

export const {
  addItem,
  deleteItem,
  increaseItemQuality,
  decreaseItemQuality,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

export const getCart = (state) => state.cart.cart;

export const getTotalCartQuantity = (state) => {
  return state.cart.cart.reduce((total, item) => total + item.quantity, 0);
};

export const getCurrentQuantityById = (id) => (state) =>
  state.cart.cart.find((item) => item.pizzaId === id)?.quantity ?? 0;

export const getTotalCartPrice = (state) => {
  return state.cart.cart.reduce((total, item) => total + item.totalPrice, 0);
};
