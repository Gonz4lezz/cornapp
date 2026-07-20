import { Link } from 'react-router-dom';
import './AdminHome.css';

const secciones = [
  {
    to: '/admin/productos',
    titulo: 'Productos',
    descripcion:
      'Gestioná los productos del catálogo: corn dogs, acompañamientos y bebidas.',
    icono: '🍟',
  },
  {
    to: '/admin/combos',
    titulo: 'Combos',
    descripcion: 'Administrá los combos y los productos que los componen.',
    icono: '📦',
  },
  {
    to: '/admin/procesos',
    titulo: 'Procesos de Preparación',
    descripcion: 'Definí el paso a paso de cocina para cada producto.',
    icono: '👨‍🍳',
  },
  {
    to: '/admin/menus',
    titulo: 'Menús',
    descripcion:
      'Configurá los menús con sus productos, combos, fechas y horarios.',
    icono: '📋',
  },
  {
    to: '/admin/cupones',
    titulo: 'Cupones',
    descripcion:
      'Creá y administrá los cupones de descuento por producto o combo.',
    icono: '🎟️',
  },
];

function AdminHome() {
  return (
    <div className="admin-home">
      <div className="page-header">
        <h1>Panel de Mantenimiento</h1>
        <p>Administrá los catálogos y contenido del sistema CornApp</p>
      </div>

      <div className="page-content">
        <div className="admin-secciones-grid">
          {secciones.map((s) => (
            <Link key={s.to} to={s.to} className="admin-seccion-card">
              <div className="admin-seccion-icono">{s.icono}</div>
              <div className="admin-seccion-info">
                <h3>{s.titulo}</h3>
                <p>{s.descripcion}</p>
              </div>
              <span className="admin-seccion-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminHome;