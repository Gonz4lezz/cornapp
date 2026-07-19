import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { menuService, resolveImageUrl } from '../services/api';
import { formatoMoneda, formatoFecha, formatoHora } from '../utils/format';
import './MenuDetalle.css';

function MenuDetalle() {
  const { id } = useParams();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    menuService
      .getById(id)
      .then((res) => {
        setMenu(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el menú');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">Cargando menú...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!menu) return <div className="error-message">Menú no encontrado</div>;

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
    <div className="menu-detalle">
      <div className="page-header">
        <Link to="/menus" className="detalle-volver">&larr; Volver a Menús</Link>
        <h1>{menu.nombre}</h1>
        <p>{menu.descripcion}</p>
      </div>

      <div className="page-content">
        {menu.fecha_inicio && menu.hora_inicio && (
          <div className="menu-detalle-horarios">
            <h3>Disponibilidad</h3>
            <div className="horarios-grid">
              <div className="horario-item">
                <span className="horario-dia">Fechas</span>
                <span className="horario-horas">
                  {formatoFecha(menu.fecha_inicio)} – {formatoFecha(menu.fecha_fin)}
                </span>
              </div>
              <div className="horario-item">
                <span className="horario-dia">Horario</span>
                <span className="horario-horas">
                  {formatoHora(menu.hora_inicio)} – {formatoHora(menu.hora_fin)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="menu-detalle-contenido">
          {Object.entries(productosPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="menu-det-categoria">
              <h3 className="menu-det-categoria-titulo">{categoria}</h3>
              <div className="menu-det-items-grid">
                {items.productos.map((prod) => (
                  <Link
                    to={`/productos/${prod.id_producto}`}
                    key={`p-${prod.id_producto}`}
                    className="menu-det-item"
                  >
                    <div className="menu-det-item-img">
                      {prod.imagen ? (
                        <img src={resolveImageUrl(prod.imagen)} alt={prod.nombre} />
                      ) : (
                        <span></span>
                      )}
                    </div>
                    <div className="menu-det-item-info">
                      <span className="menu-det-item-nombre">{prod.nombre}</span>
                      <span className="menu-det-item-precio">{formatoMoneda(prod.precio_base)}</span>
                    </div>
                  </Link>
                ))}
                {items.combos.map((combo) => (
                  <Link
                    to={`/combos/${combo.id_combo}`}
                    key={`c-${combo.id_combo}`}
                    className="menu-det-item menu-det-item-combo"
                  >
                    <div className="menu-det-item-img">
                      {combo.imagen ? (
                        <img src={resolveImageUrl(combo.imagen)} alt={combo.nombre} />
                      ) : (
                        <span></span>
                      )}
                    </div>
                    <div className="menu-det-item-info">
                      <span className="menu-det-item-nombre">
                        {combo.nombre}
                        <span className="menu-det-combo-tag">Combo</span>
                      </span>
                      <span className="menu-det-item-precio">{formatoMoneda(combo.precio_combo)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuDetalle;
