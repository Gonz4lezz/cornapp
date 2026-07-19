import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuService } from '../services/api';
import { formatoMoneda, formatoFecha, formatoHora } from '../utils/format';
import './MenuListado.css';

function MenuListado() {
  const [menus, setMenus] = useState([]);
  const [menuDisponible, setMenuDisponible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([menuService.getAll(), menuService.getDisponible()])
      .then(([menusRes, dispRes]) => {
        setMenus(menusRes.data || []);
        if (dispRes.data && dispRes.data.disponible !== false) {
          setMenuDisponible(dispRes.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los menús');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando menús...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="menu-listado">
      <div className="page-header">
        <h1>Nuestros Menús</h1>
        <p>Consultá nuestros menús y horarios de disponibilidad</p>
      </div>

      <div className="page-content">
        {menuDisponible && (
          <section className="menu-disponible-section">
            <h2 className="section-title">Menú disponible ahora</h2>
            <MenuDisponibleView menu={menuDisponible} />
          </section>
        )}

        <section className="menu-todos-section">
          <h2 className="section-title">Todos los menús</h2>
          <div className="menus-lista">
            {menus.map((menu) => (
              <Link
                to={`/menus/${menu.id_menu}`}
                key={menu.id_menu}
                className="menu-card"
              >
                <div className="menu-card-header">
                  <h3>{menu.nombre}</h3>
                  <span
                    className={`menu-card-estado ${menu.esta_activo == 1 ? 'activo' : 'inactivo'}`}
                  >
                    {menu.esta_activo == 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="menu-card-desc">{menu.descripcion}</p>
                {menu.fecha_inicio && menu.fecha_fin && (
                  <p className="menu-card-fechas">
                    {formatoFecha(menu.fecha_inicio)} – {formatoFecha(menu.fecha_fin)}
                  </p>
                )}
                <div className="menu-card-footer">
                  <span className="menu-card-items">{menu.total_items} items</span>
                  <span className="menu-card-ver">Ver detalle &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MenuDisponibleView({ menu }) {
  const productosPorCategoria = {};
  if (menu.productos) {
    menu.productos.forEach((prod) => {
      if (!productosPorCategoria[prod.categoria]) {
        productosPorCategoria[prod.categoria] = { productos: [], combos: [] };
      }
      productosPorCategoria[prod.categoria].productos.push(prod);
    });
  }
  if (menu.combos) {
    menu.combos.forEach((combo) => {
      if (!productosPorCategoria[combo.categoria]) {
        productosPorCategoria[combo.categoria] = { productos: [], combos: [] };
      }
      productosPorCategoria[combo.categoria].combos.push(combo);
    });
  }

  return (
    <div className="menu-restaurante">
      <div className="menu-restaurante-header">
        <h3>{menu.nombre}</h3>
        <p className="menu-restaurante-desc">{menu.descripcion}</p>
        {menu.fecha_inicio && menu.hora_inicio && (
          <p className="menu-restaurante-horario">
            Disponible del {formatoFecha(menu.fecha_inicio)} al {formatoFecha(menu.fecha_fin)} · {formatoHora(menu.hora_inicio)} a {formatoHora(menu.hora_fin)}
          </p>
        )}
      </div>

      <div className="menu-restaurante-body">
        {Object.entries(productosPorCategoria).map(([categoria, items]) => (
          <div key={categoria} className="menu-categoria-group">
            <h4 className="menu-categoria-titulo">{categoria}</h4>
            <div className="menu-categoria-divider"></div>

            {items.productos.map((prod) => (
              <div key={`p-${prod.id_producto}`} className="menu-item">
                <div className="menu-item-info">
                  <span className="menu-item-nombre">{prod.nombre}</span>
                  <span className="menu-item-dots"></span>
                </div>
                <span className="menu-item-precio">{formatoMoneda(prod.precio_base)}</span>
              </div>
            ))}

            {items.combos.map((combo) => (
              <div key={`c-${combo.id_combo}`} className="menu-item menu-item-combo">
                <div className="menu-item-info">
                  <span className="menu-item-nombre">
                    {combo.nombre}
                    <span className="menu-item-combo-badge">Combo</span>
                  </span>
                  <span className="menu-item-dots"></span>
                </div>
                <span className="menu-item-precio">{formatoMoneda(combo.precio_combo)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuListado;
