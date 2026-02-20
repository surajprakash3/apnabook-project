import { useContext } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { CartContext } from '../context/CartContext.jsx';
import './Cart.css';

export default function Cart() {
  const { items, removeItem, updateItemQuantity, clearCart } = useContext(CartContext);

  const formatPrice = (value) => {
    const raw = typeof value === 'number' ? value : Number.parseFloat(String(value).replace('$', ''));
    const safe = Number.isFinite(raw) ? raw : 0;
    return `$${safe.toFixed(2)}`;
  };

  const totalPrice = items.reduce((total, item) => {
    const rawPrice = typeof item.price === 'number' ? item.price : Number.parseFloat(String(item.price).replace('$', ''));
    const value = Number.isFinite(rawPrice) ? rawPrice : 0;
    const quantity = item.quantity ?? 1;
    return total + value * quantity;
  }, 0);

  const increment = (item) => {
    updateItemQuantity(item.id, (item.quantity ?? 1) + 1);
  };

  const decrement = (item) => {
    updateItemQuantity(item.id, (item.quantity ?? 1) - 1);
  };

  return (
    <div className="cart-page">
      <Navbar />
      <main className="cart-container">
        <div className="cart-header">
          <div>
            <h1>Your Shopping Cart</h1>
            <p>{items.length} items selected</p>
          </div>
          {items.length > 0 && (
            <button className="clear-cart" type="button" onClick={clearCart}>
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Browse the catalog and add your favorite books.</p>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {items.map((item) => (
                <article key={item.id} className="cart-item">
                  <div className="item-cover">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="item-placeholder">📖</div>
                    )}
                  </div>

                  <div className="item-info">
                    <h3>{item.title}</h3>
                    <p className="item-author">by {item.author}</p>
                    {(item.tag || item.category) && (
                      <span className="item-tag">{item.tag || item.category}</span>
                    )}
                  </div>

                  <div className="item-quantity">
                    <button type="button" onClick={() => decrement(item)} aria-label="Decrease quantity">
                      -
                    </button>
                    <span>{item.quantity ?? 1}</span>
                    <button type="button" onClick={() => increment(item)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>

                  <div className="item-price">
                    <span>{formatPrice(item.price)}</span>
                  </div>

                  <button
                    className="remove-item"
                    type="button"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Link to="/checkout" className="checkout-btn">
                Proceed to Checkout
              </Link>
              <p className="summary-note">Secure checkout with all major cards.</p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
