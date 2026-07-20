import { Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './Layout.css';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/productos', label: 'Productos' },
  { to: '/combos', label: 'Combos' },
  { to: '/menus', label: 'Menús' },
  { to: '/procesos', label: 'Preparación' },
  { to: '/cupones', label: 'Cupones' },
  { to: '/admin', label: 'Mantenimiento' },
];

// Integrantes del equipo DEVSHARKS (se muestran en el footer)
const integrantes = ['Jurgen Calvo González', 'Keisy Monge', 'Sebastian Hernandez'];

function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">
              <img src="/assets/cornapp-logo.png" alt="Logo" />
            </span>
            <span className="logo-text">CornApp</span>
          </Link>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={
                    location.pathname === link.to ||
                    (link.to !== '/' && location.pathname.startsWith(link.to))
                      ? 'active'
                      : ''
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col footer-brand">
              <span className="footer-logo">
                <img src="/assets/cornapp-logo-nombre.png" alt="Logo" />
              </span>
              <p className="footer-tagline">
                Auténticos corn dogs coreanos, crujientes por fuera e
                irresistibles por dentro. Hechos al momento con los mejores
                ingredientes.
              </p>
              <span className="footer-equipo">Proyecto DEVSHARKS · ISW613</span>
            </div>

            <div className="footer-col">
              <h4 className="footer-titulo">Explorar</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/productos">Productos</Link>
                </li>
                <li>
                  <Link to="/combos">Combos</Link>
                </li>
                <li>
                  <Link to="/menus">Menús</Link>
                </li>
                <li>
                  <Link to="/cupones">Cupones</Link>
                </li>
                <li>
                  <Link to="/procesos">Preparación</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-titulo">Contacto</h4>
              <ul className="footer-contacto">
                <li>📍 Alajuela, Costa Rica</li>
                <li>📞 +506 0000-0000</li>
                <li>✉️ cornapp@gmail.com</li>
                <li>🕒 Lun a Dom · 10:00 a. m. - 9:00 p. m.</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-titulo">Desarrollado por</h4>
              <ul className="footer-integrantes">
                {integrantes.map((nombre) => (
                  <li key={nombre}>{nombre}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; 2026 CornApp - Equipo DEVSHARKS.
            </p>
          </div>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#211206',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.9rem',
          },
          success: {
            iconTheme: { primary: '#FF8E42', secondary: '#FFFFFF' },
          },
          error: {
            style: { background: '#8B1E1E', color: '#FFFFFF' },
          },
        }}
      />
    </>
  );
}

export default Layout;