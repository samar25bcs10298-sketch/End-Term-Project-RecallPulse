import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cart from backend on mount or after login
  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/cart');
      if (response.data.success) {
        setCart(response.data.cart || []);
      }
    } catch (err) {
      // If 401 unauthorized, simply clear the cart state
      if (err.response?.status === 401) {
        setCart([]);
      } else {
        console.error('Fetch cart error:', err);
        setError('Unable to load your cart.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Add product to cart
  const addToCart = async (productId) => {
    try {
      const response = await api.post(`/cart/${productId}`);
      if (response.data.success) {
        setCart(response.data.cart || []);
        return { success: true };
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      const msg = err.response?.data?.message || 'Failed to add item to cart.';
      return { success: false, message: msg, status: err.response?.status };
    }
  };

  // Update quantity for a product in cart
  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await api.patch(`/cart/${productId}`, { quantity });
      if (response.data.success) {
        setCart(response.data.cart || []);
        return { success: true };
      }
    } catch (err) {
      console.error('Update quantity error:', err);
      const msg = err.response?.data?.message || 'Failed to update quantity.';
      return { success: false, message: msg };
    }
  };

  // Remove a product from cart
  const removeFromCart = async (productId) => {
    try {
      const response = await api.delete(`/cart/${productId}`);
      if (response.data.success) {
        setCart(response.data.cart || []);
        return { success: true };
      }
    } catch (err) {
      console.error('Remove from cart error:', err);
      const msg = err.response?.data?.message || 'Failed to remove item.';
      return { success: false, message: msg };
    }
  };

  // Derived values (calculated on-the-fly, not stored separately in DB)
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 0)),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        fetchCart,
        setCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
