import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productoService } from '../services/api';
import './ProductoListado.css';

function ProductoListado() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    productoService.getAll()
      .then((res) => {
        setProductos(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error al cargar los productos');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando productos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const productosPorCategoria = productos.reduce((acc, producto) => {
    const categoria = producto.categoria || 'Sin categoría';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(producto);
    return acc;
  }, {});

  return (
    <div className="producto-listado">
      <div className="page-header">
        <h1>Nuestros Productos</h1>
        <p>Descubrí todos nuestros corn dogs y acompañamientos</p>
      </div>

      <div className="page-content">
        <div className="productos-por-categoria">
          {Object.entries(productosPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="producto-categoria">
              <h2 className="producto-categoria-titulo">{categoria}</h2>
              <div className="productos-grid">
                {items.map((producto) => (
                  <Link
                    to={`/productos/${producto.id_producto}`}
                    key={producto.id_producto}
                    className="producto-card"
                  >
                    <div className="producto-card-img">
                      {producto.imagen ? (
                        <img src={producto.imagen} alt={producto.nombre} />
                      ) : (
                        <div className="producto-card-placeholder">🌽</div>
                      )}
                    </div>
                    <div className="producto-card-body">
                      <span className="producto-card-categoria">{producto.categoria}</span>
                      <h3 className="producto-card-nombre">{producto.nombre}</h3>
                      <p className="producto-card-descripcion">
                        {producto.descripcion && producto.descripcion.length > 80
                          ? producto.descripcion.substring(0, 80) + '...'
                          : producto.descripcion}
                      </p>
                      <span className="producto-card-precio">
                        ₡{Number(producto.precio_base).toLocaleString('es-CR')}
                      </span>
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

export default ProductoListado;
