import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const ProductCard = ({ product, isWishlisted = false, onWishlistChange, user }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [message, setMessage] = useState({ text: '', type: '' });

  const isOutOfStock = product.stock <= 0;

  const showFeedback = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Handle Wishlist Toggle
  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please log in to save items to your wishlist.' } });
      return;
    }

    setWishlistLoading(true);
    try {
      const response = await api.patch(`/wishlist/${product._id}/toggle`);
      if (response.data.success) {
        setWishlisted(response.data.saved);
        showFeedback(response.data.saved ? '♥ Added to Wishlist' : '♡ Removed from Wishlist', 'success');
        if (onWishlistChange) onWishlistChange();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { message: 'Please log in to manage your wishlist.' } });
      } else {
        showFeedback('Unable to update wishlist. Try again.', 'error');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please log in to add items to your cart.' } });
      return;
    }

    setCartLoading(true);
    const result = await addToCart(product._id);
    setCartLoading(false);

    if (result.success) {
      showFeedback('Added to cart!', 'success');
    } else {
      if (result.status === 401) {
        navigate('/login', { state: { message: 'Please log in to add items to your cart.' } });
      } else {
        showFeedback(result.message || 'Could not add to cart.', 'error');
      }
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
          }}
        />
        <span className="category-badge">{product.category}</span>

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`btn-wishlist-toggle ${wishlisted ? 'active' : ''}`}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {wishlistLoading ? '⏳' : wishlisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="product-card-body">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-price">₹{product.price.toLocaleString('en-IN')}</p>

        <div className="product-stock-status">
          {isOutOfStock ? (
            <span className="stock-badge out-of-stock">Out of Stock</span>
          ) : (
            <span className="stock-badge in-stock">{product.stock} units left</span>
          )}
        </div>

        {message.text && (
          <div className={`card-alert ${message.type === 'success' ? 'card-alert-success' : 'card-alert-error'}`}>
            {message.text}
          </div>
        )}

        <div className="card-actions">
          <Link to={`/products/${product._id}`} className="btn-view-details">
            View Details
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartLoading}
            className="btn-card-add-cart"
          >
            {cartLoading ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
