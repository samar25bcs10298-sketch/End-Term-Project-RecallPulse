import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const ProductDetails = ({ user, onWishlistChange, wishlistIds = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(wishlistIds.includes(id));
  }, [id, wishlistIds]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Fetch product details error:', err);
        const msg = err.response?.data?.message || 'Failed to load product details.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please log in to add items to your cart.' } });
      return;
    }

    setCartLoading(true);
    const result = await addToCart(product._id);
    setCartLoading(false);

    if (result.success) {
      showFeedback(`🛒 Added "${product.name}" to cart!`, 'success');
    } else {
      if (result.status === 401) {
        navigate('/login', { state: { message: 'Please log in to add items to your cart.' } });
      } else {
        showFeedback(result.message || 'Could not add to cart.', 'error');
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please log in to save items to your wishlist.' } });
      return;
    }

    setWishlistLoading(true);
    try {
      const response = await api.patch(`/wishlist/${product._id}/toggle`);
      if (response.data.success) {
        setIsWishlisted(response.data.saved);
        showFeedback(response.data.saved ? '♥ Added to Wishlist' : '♡ Removed from Wishlist', 'success');
        if (onWishlistChange) onWishlistChange();
      }
    } catch (err) {
      showFeedback('Unable to update wishlist. Try again.', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="loading-spinner">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="state-container">
        <div className="alert alert-error">{error || 'Product not found'}</div>
        <Link to="/products" className="btn-back">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="details-container">
      <Link to="/products" className="btn-back-link">
        ← Back to Products
      </Link>

      {feedback.text && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} mt-1`}>
          {feedback.text}
        </div>
      )}

      <div className="details-card">
        <div className="details-image-section">
          <img
            src={product.image}
            alt={product.name}
            className="details-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x400?text=Product+Image';
            }}
          />
        </div>

        <div className="details-info-section">
          <span className="category-tag">{product.category}</span>
          <h1 className="details-title">{product.name}</h1>
          <p className="details-price">₹{product.price.toLocaleString('en-IN')}</p>

          <div className="details-stock-row">
            <span className="stock-label">Availability:</span>
            {product.stock > 0 ? (
              <span className="stock-badge in-stock">{product.stock} units in stock</span>
            ) : (
              <span className="stock-badge out-of-stock">Out of Stock</span>
            )}
          </div>

          <p className="details-description">{product.description}</p>

          <div className="details-button-row">
            <button
              onClick={handleAddToCart}
              className="btn-add-to-cart"
              disabled={product.stock <= 0 || cartLoading}
            >
              {cartLoading ? 'Adding...' : '🛒 Add to Cart'}
            </button>
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`btn-details-wishlist ${isWishlisted ? 'active' : ''}`}
            >
              {wishlistLoading ? '⏳' : isWishlisted ? '♥ Saved in Wishlist' : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
