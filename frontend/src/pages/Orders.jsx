import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders');
        setOrders(data);
      } catch (err) {
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p className="loading-msg">Loading your orders...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Orders Yet</h2>
        <p>You haven't placed any orders. Start shopping!</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2>My Orders</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-card-header">
              <div>
                <p className="order-card-id">Order ID: {order._id}</p>
                <p className="order-card-date">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className={`order-status ${order.paymentStatus}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>

            <div className="order-card-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-card-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-card-footer">
              <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
              <Link to={`/order-success/${order._id}`} className="btn-outline btn-sm">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
