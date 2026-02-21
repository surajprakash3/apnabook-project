import { useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import Navbar from '../components/Navbar.jsx';
import BookCard from '../components/BookCard.jsx';
import Footer from '../components/Footer.jsx';
import { CartContext } from '../context/CartContext.jsx';
import api from '../lib/api.js';
import './BookList.css';

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' }
];

export default function BookList() {
  const { addItem } = useContext(CartContext);
  const { token } = useAuth();
  const [toastMsg, setToastMsg] = useState('');

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    categoryCounts: [],
    priceRange: { min: 0, max: 100 }
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceInitialized, setPriceInitialized] = useState(false);

  const categories = useMemo(
    () => [
      { name: 'All', count: meta.total },
      ...meta.categoryCounts.map((entry) => ({ name: entry.category, count: entry.count }))
    ],
    [meta.total, meta.categoryCounts]
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      withMeta: 'true',
      status: 'Active',
      approvalStatus: 'Approved',
      sort: sortBy,
      page: String(page),
      limit: '12'
    });

    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (minRating > 0) params.set('rating', String(minRating));
    params.set('minPrice', String(priceRange.min));
    params.set('maxPrice', String(priceRange.max));

    return params.toString();
  }, [selectedCategory, searchQuery, minRating, sortBy, page, priceRange.min, priceRange.max]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await api.get(`/api/products?${queryString}`);
        if (!active) return;

        const incomingItems = Array.isArray(data?.items) ? data.items : [];
        const incomingMeta = data?.meta || {};

        setProducts(incomingItems);
        setMeta({
          page: Number(incomingMeta.page || 1),
          limit: Number(incomingMeta.limit || 12),
          total: Number(incomingMeta.total || 0),
          totalPages: Number(incomingMeta.totalPages || 1),
          categoryCounts: Array.isArray(incomingMeta.categoryCounts) ? incomingMeta.categoryCounts : [],
          priceRange: incomingMeta.priceRange || { min: 0, max: 100 }
        });

        if (!priceInitialized) {
          const dynamicMin = Number(incomingMeta?.priceRange?.min || 0);
          const dynamicMax = Number(incomingMeta?.priceRange?.max || 100);
          setPriceRange({ min: dynamicMin, max: dynamicMax });
          setPriceInitialized(true);
        }
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Failed to load collection');
        setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();

    const refreshId = setInterval(loadProducts, 15000);
    const onMarketplaceUpdate = () => loadProducts();
    window.addEventListener('marketplace:updated', onMarketplaceUpdate);

    return () => {
      active = false;
      clearInterval(refreshId);
      window.removeEventListener('marketplace:updated', onMarketplaceUpdate);
    };
  }, [queryString, priceInitialized]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setPriceRange({
      min: Number(meta.priceRange?.min || 0),
      max: Number(meta.priceRange?.max || 100)
    });
    setMinRating(0);
    setSortBy('featured');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="book-list-page">
      <Navbar />
      <main className="book-list-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Explore Our Collection</h1>
            <p>Discover {meta.total} amazing products</p>
          </div>
          <button className="mobile-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? '✕ Close Filters' : '⚙ Filters'}
          </button>
        </div>

        <div className="book-list-layout">
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="reset-btn" onClick={resetFilters}>
                Reset All
              </button>
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              <div className="category-list">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setPage(1);
                    }}
                  >
                    {category.name}
                    <span className="count">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <div className="price-input-group">
                  <label>Min</label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value || 0);
                      setPriceRange((prev) => ({ min: Math.min(nextMin, prev.max), max: prev.max }));
                      setPage(1);
                    }}
                    min="0"
                    max={priceRange.max}
                  />
                </div>
                <span className="price-separator">-</span>
                <div className="price-input-group">
                  <label>Max</label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => {
                      const nextMax = Number(e.target.value || 0);
                      setPriceRange((prev) => ({ min: prev.min, max: Math.max(nextMax, prev.min) }));
                      setPage(1);
                    }}
                    min={priceRange.min}
                    max={Math.max(priceRange.max, Number(meta.priceRange?.max || 100))}
                  />
                </div>
              </div>
              <input
                type="range"
                min={Number(meta.priceRange?.min || 0)}
                max={Math.max(Number(meta.priceRange?.max || 100), Number(priceRange.max || 0))}
                value={priceRange.max}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPriceRange((prev) => ({ min: prev.min, max: Math.max(next, prev.min) }));
                  setPage(1);
                }}
                className="price-slider"
              />
              <div className="price-display">
                ${priceRange.min} - ${priceRange.max}
              </div>
            </div>

            <div className="filter-group">
              <h4>Minimum Rating</h4>
              <div className="rating-options">
                {[0, 3, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    className={`rating-btn ${minRating === rating ? 'active' : ''}`}
                    onClick={() => {
                      setMinRating(rating);
                      setPage(1);
                    }}
                  >
                    {rating === 0 ? 'All Ratings' : `${rating}★ & up`}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="books-content">
            <div className="controls-bar">
              <div className="result-info">
                Showing <strong>{products.length}</strong> of <strong>{meta.total}</strong> products
              </div>
              <div className="sort-control">
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by title or creator"
                  className="rounded-full border border-[#e0ddd8] bg-white px-4 py-2 text-sm"
                />
              </div>
              <div className="sort-control">
                <label>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="no-results">
                <h3>Loading products...</h3>
              </div>
            ) : error ? (
              <div className="no-results">
                <h3>Could not load products</h3>
                <p>{error}</p>
              </div>
            ) : products.length > 0 ? (
              <div className="books-grid">
                {products.map((product) => (
                  <BookCard
                    key={String(product._id || product.id)}
                    image={product.previewUrl}
                    title={product.title}
                    author={product.creator}
                    price={`$${Number(product.price || 0).toFixed(2)}`}
                    rating={Number(product.rating || 0)}
                    tag={product.category}
                    linkTo={`/marketplace/${String(product._id || product.id)}`}
                    onAddToCart={async () => {
                      if (!token) {
                        setToastMsg('Please login first to add items to cart');
                        setTimeout(() => {
                          setToastMsg('');
                          localStorage.setItem('pustakly_redirect_after_login', window.location.pathname + window.location.search);
                          window.location.href = '/login';
                        }, 1500);
                        return;
                      }
                      try {
                        await addItem({
                          ...product,
                          id: String(product._id || product.id),
                          quantity: 1,
                          price: Number(product.price || 0)
                        });
                        setToastMsg('Added to cart!');
                        setTimeout(() => setToastMsg(''), 1500);
                      } catch (err) {
                        setToastMsg(err.message || 'Failed to add to cart');
                        setTimeout(() => setToastMsg(''), 2000);
                      }
                    }}
                    disableAdd={!token}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">📚</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            )}

            {meta.totalPages > 1 && !loading && !error && (
              <div className="controls-bar">
                <button
                  className="reset-btn"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <div className="result-info">
                  Page <strong>{page}</strong> of <strong>{meta.totalPages}</strong>
                </div>
                <button
                  className="reset-btn"
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      <Footer />
    </div>
  );
}
