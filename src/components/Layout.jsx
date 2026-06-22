import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/productos', label: 'Productos' },
  { to: '/combos', label: 'Combos' },
  { to: '/menus', label: 'Menús' },
  { to: '/procesos', label: 'Preparación' },
];

function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon"></span>
            <span className="logo-text">CornApp</span>
          </Link>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to)) ? 'active' : ''}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2026 CornApp — DEVSHARKS</p>
        </div>
      </footer>
    </>
  );
}

export default Layout;
