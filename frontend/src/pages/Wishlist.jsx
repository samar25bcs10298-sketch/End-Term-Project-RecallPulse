import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const Wishlist = ({ user, onWishlistChange }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [cartLoadingId, setCartLoadingId] = useState(null);

  const showMessage = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 3000);
  };

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/wishlist');
      if (response.data.success) {
        setWishlist(response.data.wishlist || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { message: 'Please log in to view your wishlist.' } });
      } else {
        console.error('Fetch wishlist error:', err);
        setError('Something went wrong. We couldn\'t load your wishlist.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      if (response.data.success) {
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
        showMessage('Product removed from wishlist', 'success');
        if (onWishlistChange) onWishlistChange();
      }
    } catch (err) {
      showMessage('Unable to remove product. Try again.', 'error');
    }
  };

  const handleAddToCart = async (product) => {
    setCartLoadingId(product._id);
    const result = await addToCart(product._id);
    setCartLoadingId(null);

    if (result.success) {
      showMessage(`Added "${product.name}" to cart!`, 'success');
    } else {
      showMessage(result.message || 'Could not add to cart.', 'error');
    }
  };

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        <p className="subtitle">
          {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
        </p>
      </div>

      {actionMessage.text && (
        <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'} mt-1`}>
          {actionMessage.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="state-container">
          <div className="loading-spinner">Loading your wishlist...</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-container">
          <div className="alert alert-error">{error}</div>
          <button onClick={fetchWishlist} className="btn-retry">
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && wishlist.length === 0 && (
        <div className="state-container empty-wishlist-state">
          <div className="empty-icon">❤️</div>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and find them here later.</p>
          <Link to="/products" className="btn-browse-products">
            Browse Products
          </Link>
        </div>
      )}

      {/* Wishlist Grid */}
      {!loading && !error && wishlist.length > 0 && (
        <div className="wishlist-grid">
          {wishlist.map((product) => {
            if (!product) return null;
            const isOutOfStock = product.stock <= 0;

            return (
              <div key={product._id} className="wishlist-card">
                <div className="wishlist-card-image-box">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="wishlist-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
                    }}
                  />
                  <span className="category-badge">{product.category}</span>
                </div>

                <div className="wishlist-card-body">
                  <h3 className="wishlist-card-title">{product.name}</h3>
                  <p className="wishlist-card-price">₹{product.price.toLocaleString('en-IN')}</p>

                  <div className="stock-info">
                    {isOutOfStock ? (
                      <span className="stock-badge out-of-stock">Out of Stock</span>
                    ) : (
                      <span className="stock-badge in-stock">{product.stock} units left</span>
                    )}
                  </div>

                  <div className="wishlist-card-actions">
                    <Link to={`/products/${product._id}`} className="btn-view">
                      View Details
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock || cartLoadingId === product._id}
                      className="btn-add-cart-sm"
                    >
                      {cartLoadingId === product._id ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="btn-remove-wishlist"
                    >
                      Remove ♥
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
