import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <h3>Pustakly</h3>
          <p>Modern reads with a thoughtful curation lens.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Shop</h4>
            <a href="#banner">Highlights</a>
            <a href="#trending">Trending</a>
            <a href="#offers">Offers</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Shipping</a>
            <a href="#">Returns</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Pustakly. All rights reserved.</span>
        <div className="socials">
          <a href="#">Instagram</a>
          <a href="#">X</a>
          <a href="#">YouTube</a>
        </div>
      </div>
    </footer>
  );
}
