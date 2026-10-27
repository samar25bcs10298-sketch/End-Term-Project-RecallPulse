import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch (err) {
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <p className="loading-msg">Loading order details...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="success-icon">✓</div>
        <h2>Order Placed Successfully!</h2>
        <p className="order-id-text">Order ID: <strong>{order._id}</strong></p>

        <div className="success-items">
          {order.items.map((item, index) => (
            <div key={index} className="success-item">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="success-total">
          <strong>Total Paid</strong>
          <strong>₹{order.totalAmount.toFixed(2)}</strong>
        </div>

        <div className="success-address">
          <h4>Delivering to</h4>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.addressLine}, {order.shippingAddress.city}</p>
          <p>{order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
          <p>{order.shippingAddress.phone}</p>
        </div>

        <div className="success-actions">
          <Link to="/orders" className="btn-primary">My Orders</Link>
          <Link to="/products" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
