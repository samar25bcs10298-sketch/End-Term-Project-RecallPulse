import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = ({ user }) => {
  const navigate = useNavigate();
  const { cart, loading, error, totalItems, subtotal, updateQuantity, removeFromCart, fetchCart } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleQuantityChange = async (productId, currentQty, delta, maxStock) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (newQty > maxStock) {
      setActionError(`Cannot add more. Only ${maxStock} units available in stock.`);
      setTimeout(() => setActionError(''), 3000);
      return;
    }

    setUpdatingId(productId);
    setActionError('');
    const res = await updateQuantity(productId, newQty);
    setUpdatingId(null);

    if (!res.success) {
      setActionError(res.message);
      setTimeout(() => setActionError(''), 3000);
    }
  };

  const handleRemove = async (productId) => {
    setUpdatingId(productId);
    await removeFromCart(productId);
    setUpdatingId(null);
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="cart-page-container">
      <div className="cart-header">
        <h1>My Shopping Cart</h1>
        <p className="subtitle">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {actionError && <div className="alert alert-error mt-1">{actionError}</div>}

      {/* Loading State */}
      {loading && (
        <div className="state-container">
          <div className="loading-spinner">Loading your cart...</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-container">
          <div className="alert alert-error">{error}</div>
          <button onClick={fetchCart} className="btn-retry">
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && cart.length === 0 && (
        <div className="state-container empty-cart-state">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products" className="btn-browse-products">
            Browse Products
          </Link>
        </div>
      )}

      {/* Cart Content: Items + Order Summary */}
      {!loading && !error && cart.length > 0 && (
        <div className="cart-layout">
          {/* Items List */}
          <div className="cart-items-list">
            {cart.map((item) => {
              const product = item.product;
              if (!product) return null;
              const isUpdating = updatingId === product._id;
              const itemTotal = (product.price || 0) * item.quantity;
              const atMaxStock = item.quantity >= product.stock;

              return (
                <div key={product._id} className="cart-item-card">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/120x120?text=Product';
                    }}
                  />

                  <div className="cart-item-details">
                    <span className="cart-item-category">{product.category}</span>
                    <h3 className="cart-item-title">
                      <Link to={`/products/${product._id}`}>{product.name}</Link>
                    </h3>
                    <p className="cart-item-unit-price">
                      ₹{product.price.toLocaleString('en-IN')} each
                    </p>
                    <span className="cart-stock-note">
                      ({product.stock} available in stock)
                    </span>
                  </div>

                  <div className="cart-item-actions-col">
                    {/* Quantity Controls: [-] qty [+] */}
                    <div className="quantity-control-group">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product._id, item.quantity, -1, product.stock)}
                        disabled={item.quantity <= 1 || isUpdating}
                        className="btn-qty"
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-display">{isUpdating ? '…' : item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product._id, item.quantity, 1, product.stock)}
                        disabled={atMaxStock || isUpdating}
                        className="btn-qty"
                        title={atMaxStock ? 'Maximum stock reached' : 'Increase quantity'}
                      >
                        +
                      </button>
                    </div>

                    <p className="cart-item-subtotal">₹{itemTotal.toLocaleString('en-IN')}</p>

                    <button
                      type="button"
                      onClick={() => handleRemove(product._id)}
                      disabled={isUpdating}
                      className="btn-remove-cart-item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Total Units</span>
              <span>{totalItems}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="summary-subtotal">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charges</span>
              <span className="text-free">FREE</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total-row">
              <span>Order Total</span>
              <span className="summary-total-price">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <button onClick={handleCheckout} className="btn-proceed-checkout">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
