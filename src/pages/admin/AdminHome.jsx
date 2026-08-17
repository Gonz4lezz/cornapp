import { Link } from 'react-router-dom';
import './AdminHome.css';
import CategoryIcon from '@mui/icons-material/Category';
import AutoAwesomeMosaicRoundedIcon from '@mui/icons-material/AutoAwesomeMosaicRounded';
import OutdoorGrillRoundedIcon from '@mui/icons-material/OutdoorGrillRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import LocalActivityRoundedIcon from '@mui/icons-material/LocalActivityRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';

const secciones = [
  {
    to: '/admin/productos',
    titulo: 'Productos',
    descripcion:
      'Gestioná los productos del catálogo: corn dogs, acompañamientos y bebidas.',
    icono: <CategoryIcon fontSize="large" sx={{ color: '#ff8e42' }} />,
  },
  {
    to: '/admin/combos',
    titulo: 'Combos',
    descripcion: 'Administrá los combos y los productos que los componen.',
    icono: (
      <AutoAwesomeMosaicRoundedIcon
        fontSize="large"
        sx={{ color: '#ff8e42' }}
      />
    ),
  },
  {
    to: '/admin/procesos',
    titulo: 'Procesos de Preparación',
    descripcion: 'Definí el paso a paso de cocina para cada producto.',
    icono: (
      <OutdoorGrillRoundedIcon fontSize="large" sx={{ color: '#ff8e42' }} />
    ),
  },
  {
    to: '/admin/menus',
    titulo: 'Menús',
    descripcion:
      'Configurá los menús con sus productos, combos, fechas y horarios.',
    icono: <MenuBookRoundedIcon fontSize="large" sx={{ color: '#ff8e42' }} />,
  },
  {
    to: '/admin/cupones',
    titulo: 'Cupones',
    descripcion:
      'Creá y administrá los cupones de descuento por producto o combo.',
    icono: (
      <LocalActivityRoundedIcon fontSize="large" sx={{ color: '#ff8e42' }} />
    ),
  },
  {
    to: '/admin/usuarios',
    titulo: 'Usuarios',
    descripcion:
      'Consultá las cuentas registradas y creá el personal de encargado y cocina.',
    icono: <GroupRoundedIcon fontSize="large" sx={{ color: '#ff8e42' }} />,
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
