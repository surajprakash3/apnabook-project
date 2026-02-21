import './Home.css';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import CategorySection from '../components/CategorySection.jsx';
import Footer from '../components/Footer.jsx';
import { useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import api from '../lib/api.js';

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const RatingStars = ({ rating = 0 }) => {
  const safe = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <div className="flex items-center gap-1 text-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < Math.round(safe) ? 'text-[#f59e0b]' : 'text-[#d6d3d1]'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-[#7a726b]">{safe.toFixed(1)}</span>
    </div>
  );
};

export default function Home() {
  const { addItem } = useContext(CartContext);
  const { token } = useAuth();
  const { listings } = useMarketplace();
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    let active = true;

    const loadTrending = async () => {
      setTrendingLoading(true);
      setTrendingError('');
      try {
        const data = await api.get('/api/products/trending?limit=8');
        if (active) {
          setTrending(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          setTrendingError(error.message || 'Failed to load trending products');
          setTrending([]);
        }
      } finally {
        if (active) setTrendingLoading(false);
      }
    };

    loadTrending();

    const timer = setInterval(loadTrending, 15000);
    window.addEventListener('marketplace:updated', loadTrending);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('marketplace:updated', loadTrending);
    };
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main>
        <Hero />

        <section id="banner" className="section banner-strip">
          <div className="banner-glow"></div>
          <div className="banner-content">
            <span className="banner-badge">✨ Limited Edition</span>
            <p className="eyebrow">Flash Sale • Ends in 24 hours</p>
            <h2>Midnight Readers Collection</h2>
            <p className="banner-description">
              Discover handpicked thrillers, mysteries, and dark academia titles. 
              Get <strong>30% off</strong> on all featured books + free express shipping.
            </p>
            <div className="banner-features">
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>500+ titles</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎁</span>
                <span>Gift wrap free</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <span>Fast delivery</span>
              </div>
            </div>
            <div className="banner-actions">
              <button className="primary-btn" type="button">
                Shop Now <span className="arrow">→</span>
              </button>
              <button className="outline-btn" type="button">Browse Collection</button>
            </div>
          </div>
          <div className="banner-visual">
            <div className="floating-book book-1">
              <div className="book-spine"></div>
              <div className="book-front">
                <span>The Midnight Library</span>
              </div>
            </div>
            <div className="floating-book book-2">
              <div className="book-spine"></div>
              <div className="book-front">
                <span>Dark Academia</span>
              </div>
            </div>
            <div className="floating-book book-3">
              <div className="book-spine"></div>
              <div className="book-front">
                <span>Mystery Tales</span>
              </div>
            </div>
          </div>
        </section>

        <section id="trending" className="section trending-section">
          <div className="section-header">
            <span className="section-badge">🔥 Hot Picks</span>
            <h2>Trending This Week</h2>
            <p>Bestsellers flying off our shelves - grab yours before they're gone!</p>
          </div>
          {trendingLoading ? (
            <div className="rounded-2xl border border-dashed border-[#e0ddd8] bg-white p-8 text-center text-sm text-[#7a726b]">
              Loading trending products...
            </div>
          ) : trendingError ? (
            <div className="rounded-2xl border border-[#f3c7bf] bg-[#fff3f0] p-8 text-center text-sm font-semibold text-[#a53f30]">
              {trendingError}
            </div>
          ) : (
            <div className="trending-grid">
              {trending.map((item, index) => (
                <article key={String(item._id || item.id)} className="book-wrapper rounded-2xl border border-[#efe5dc] bg-white p-4" style={{ animationDelay: `${index * 0.1}s` }}>
                  <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                    {item.category || 'General'}
                  </span>
                  <div className="mt-3 rounded-xl bg-[#f3ece6] p-3">
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt={item.title} className="h-40 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-4xl">📦</div>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-[#7a726b]">by {item.creator}</p>
                  <div className="mt-2">
                    <RatingStars rating={item.rating} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
                    <button
                      type="button"
                      className="rounded-full bg-[#1d1b19] px-4 py-2 text-xs font-semibold text-white"
                      onClick={() => {
                        if (!token) {
                          setToastMsg('Please login first');
                          setTimeout(() => {
                            setToastMsg('');
                            localStorage.setItem('pustakly_redirect_after_login', window.location.pathname + window.location.search);
                            window.location.href = '/login';
                          }, 1200);
                          return;
                        }
                        addItem({
                          ...item,
                          id: String(item._id || item.id),
                          price: formatPrice(item.price),
                          quantity: 1
                        });
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="view-all-container">
            <button className="ghost-btn view-all-btn" type="button">
              View All Books <span className="arrow">→</span>
            </button>
          </div>
        </section>

        <section id="marketplace" className="section">
          <div className="section-header">
            <span className="section-badge">🧩 Community Marketplace</span>
            <h2>Buy & Sell Digital Resources</h2>
            <p>Fresh uploads from creators, students, and designers.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.slice(0, 6).map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#efe5dc] bg-white p-5 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                      {item.type}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-[#7a726b]">by {item.creator}</p>
                  </div>
                  <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                    Seller
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#6f6861]">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">${Number(item.price || 0).toFixed(2)}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#a88874]">{item.category}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[#1d1b19] px-4 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      if (!token) {
                        setToastMsg('Please login first');
                        setTimeout(() => {
                          setToastMsg('');
                          localStorage.setItem('pustakly_redirect_after_login', window.location.pathname + window.location.search);
                          window.location.href = '/login';
                        }, 1200);
                        return;
                      }
                      addItem({ ...item, price: `$${Number(item.price || 0).toFixed(2)}`, quantity: 1 });
                    }}
                  >
                    Add to Cart
                  </button>
                  <Link
                    to={`/marketplace/${item.id}`}
                    className="rounded-full border border-[#d9cfc6] px-4 py-2 text-xs font-semibold"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="view-all-container">
            <Link className="ghost-btn view-all-btn" to="/marketplace">
              View Marketplace <span className="arrow">→</span>
            </Link>
          </div>
        </section>

        <section id="offers" className="section offers-section">
          <div className="section-header">
            <span className="section-badge">💎 Exclusive Deals</span>
            <h2>Special Offers Just For You</h2>
            <p>Limited-time bundles and premium perks to enhance your reading journey.</p>
          </div>
          <div className="offer-grid">
            <article className="offer-card card-purple">
              <div className="offer-header">
                <span className="offer-icon">📦</span>
                <span className="offer-pill">Bundle Deal</span>
              </div>
              <h3>Buy 2, Get 1 Free</h3>
              <p className="offer-desc">Mix and match from fiction, fantasy, romance, or thriller categories.</p>
              <div className="offer-features">
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Stack with loyalty points</span>
                </div>
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Instant checkout</span>
                </div>
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Free bookmarks included</span>
                </div>
              </div>
              <button className="offer-btn" type="button">
                Explore Bundle <span className="arrow">→</span>
              </button>
            </article>

            <article className="offer-card card-gradient">
              <div className="offer-header">
                <span className="offer-icon">👑</span>
                <span className="offer-pill gold">Premium Access</span>
              </div>
              <h3>VIP Member Benefits</h3>
              <p className="offer-desc">Unlock exclusive early releases, signed editions, and private author events.</p>
              <div className="offer-features">
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Early book releases</span>
                </div>
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Signed copies</span>
                </div>
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Free express shipping</span>
                </div>
              </div>
              <button className="offer-btn premium" type="button">
                Join Now <span className="arrow">→</span>
              </button>
            </article>

            <article className="offer-card card-blue">
              <div className="offer-header">
                <span className="offer-icon">🎓</span>
                <span className="offer-pill">Student Plan</span>
              </div>
              <h3>Student Discount</h3>
              <p className="offer-desc">Verified students save 20% every month on all purchases year-round.</p>
              <div className="offer-features">
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>20% off all books</span>
                </div>
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Textbook bundles</span>
                </div>
                <div className="feature-check">
                  <span className="check-icon">✓</span>
                  <span>Cancel anytime</span>
                </div>
              </div>
              <button className="offer-btn" type="button">
                Verify Now <span className="arrow">→</span>
              </button>
            </article>
          </div>
        </section>

        <CategorySection />

        <section id="cta" className="section cta-section">
          <div className="cta-overlay"></div>
          <div className="cta-wrapper">
            <div className="cta-content">
              <span className="cta-badge">📖 Join Our Community</span>
              <h2>Start Your Next Chapter Today</h2>
              <p className="cta-subtitle">
                Join over <strong>120,000+ readers</strong> who receive curated monthly picks, 
                exclusive author interviews, and surprise perks delivered to their inbox.
              </p>
              <div className="cta-stats">
                <div className="stat-item">
                  <span className="stat-icon">📚</span>
                  <div>
                    <strong>5,000+</strong>
                    <span>Curated Books</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <div>
                    <strong>4.9/5</strong>
                    <span>Reader Rating</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🎁</span>
                  <div>
                    <strong>Free</strong>
                    <span>Gift Wrapping</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cta-form">
              <h3>Sign Up Now</h3>
              <p>Get your first book at 50% off!</p>
              <div className="form-group">
                <input type="email" placeholder="Enter your email" className="email-input" />
                <button className="cta-btn" type="button">
                  Get Started <span className="arrow">→</span>
                </button>
              </div>
              <p className="form-note">
                ✓ No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      <Footer />
    </div>
  );
}
