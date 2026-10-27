import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const categories = ['All', 'Electronics', 'Fashion', 'Books', 'Home'];

const Products = ({ user, onWishlistChange, wishlistIds = [] }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial query params from the browser URL address bar
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || '';

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (sort) params.sort = sort;

      // 1. Sync search/filter state to the browser address bar URL
      setSearchParams(params);

      // 2. Fetch filtered products from backend API
      const response = await api.get('/products', { params });
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        setProducts(response.data || []);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, sort]);

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Discover Products</h1>
        <p className="subtitle">Browse our wide selection of items</p>
      </div>

      {/* Filter Controls Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="select-filters">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-dropdown"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="filter-dropdown"
          >
            <option value="">Sort by (Default)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* UI States */}
      {loading && (
        <div className="state-container">
          <div className="loading-spinner">Loading products...</div>
        </div>
      )}

      {!loading && error && (
        <div className="state-container">
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="state-container empty-state">
          <h3>No products found</h3>
          <p>Try clearing your search query or choosing another category.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              user={user}
              isWishlisted={wishlistIds.includes(product._id)}
              onWishlistChange={onWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
