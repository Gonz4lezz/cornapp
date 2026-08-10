import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, MenuItem, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import './Layout.css';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Integrantes del equipo DEVSHARKS (se muestran en el footer)
const integrantes = [
  'Jurgen Calvo González',
  'Keisy Monge',
  'Sebastian Hernandez',
];

// Links del menú según el rol del usuario (null = visitante sin sesión)
const linksSegunRol = (usuario) => {
  const publicos = [
    { to: '/', label: 'Inicio' },
    { to: '/productos', label: 'Productos' },
    { to: '/combos', label: 'Combos' },
    { to: '/menus', label: 'Menús' },
    { to: '/procesos', label: 'Preparación' },
    { to: '/cupones', label: 'Cupones' },
  ];
  if (!usuario) return publicos;

  const rol = usuario.rol;
  const links = [...publicos];
  if (rol === 'Cliente') {
    links.push({ to: '/pedidos', label: 'Mis pedidos' });
  }
  if (rol === 'Encargado') {
    links.push({ to: '/pedidos', label: 'Pedidos' });
  }
  if (rol === 'Cocina') {
    links.push({ to: '/cocina', label: 'Cocina' });
  }
  if (rol === 'Administrador') {
    links.push({ to: '/pedidos', label: 'Pedidos' });
    links.push({ to: '/admin', label: 'Mantenimiento' });
  }
  return links;
};

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, puedeComprar, cerrarSesion } = useAuth();
  const { cantidadTotal } = useCarrito();
  const translateRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Reubica el widget real de Google Translate (definido en index.html)
  // dentro del header, sin reinicializarlo: sigue funcionando igual.
  useEffect(() => {
    const widget = document.getElementById('google_translate_element');
    if (
      widget &&
      translateRef.current &&
      widget.parentNode !== translateRef.current
    ) {
      translateRef.current.appendChild(widget);
    }
  }, []);

  const navLinks = linksSegunRol(usuario);

  const salir = () => {
    setMenuAnchor(null);
    cerrarSesion();
    navigate('/');
  };

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

          <div className="navbar-right">
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

            {puedeComprar && (
              <Link
                to="/carrito"
                className={`navbar-carrito ${
                  location.pathname === '/carrito' ? 'active' : ''
                }`}
                title="Ver carrito"
              >
                <ShoppingCartIcon />
                {cantidadTotal > 0 && (
                  <span className="navbar-carrito-badge">{cantidadTotal}</span>
                )}
              </Link>
            )}

            {usuario ? (
              <>
                <button
                  type="button"
                  className="navbar-usuario"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                >
                  <span className="navbar-usuario-avatar">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </span>
                  <span className="navbar-usuario-nombre">
                    {usuario.nombre}
                  </span>
                </button>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  <div className="navbar-menu-info">
                    <strong>
                      {usuario.nombre} {usuario.apellido}
                    </strong>
                    <span>{usuario.correo}</span>
                    <span className="navbar-menu-rol">{usuario.rol}</span>
                  </div>
                  <Divider />
                  <MenuItem onClick={salir}>Cerrar sesión</MenuItem>
                </Menu>
              </>
            ) : (
              <Link to="/login" className="navbar-login">
                Iniciar sesión
              </Link>
            )}

            <div className="navbar-translate" ref={translateRef}></div>
          </div>
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
                <li>
                  <LocationOnIcon fontSize="small"/>
                  Alajuela, Costa Rica
                </li>
                <li>
                  <LocalPhoneIcon fontSize="small"/>
                  +506 0000-0000
                </li>
                <li>
                  <EmailIcon fontSize="small"/>
                  cornapp@gmail.com
                </li>
                <li>
                  <AccessTimeIcon fontSize="small"/>
                  Lun a Dom · 10:00 a. m. – 9:00 p. m.
                </li>
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
            <p>&copy; 2026 CornApp — Equipo DEVSHARKS.</p>
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