import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  productoService,
  cuponService,
  resolveImageUrl,
} from '../services/api';
import { formatoMoneda } from '../utils/format';
import CuponBanner from '../components/CuponBanner';
import BotonAgregarCarrito from '../components/BotonAgregarCarrito';
import './ProductoDetalle.css';

function ProductoDetalle() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [cupon, setCupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    productoService
      .getById(id)
      .then((res) => {
        setProducto(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el producto');
        setLoading(false);
      });

    // Cupón vigente del producto (opcional, no bloquea la vista)
    cuponService
      .getPorProducto(id)
      .then((res) => {
        if (res.data && res.data.id_cupon) setCupon(res.data);
        else setCupon(null);
      })
      .catch(() => setCupon(null));
  }, [id]);

  if (loading) return <div className="loading">Cargando producto...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!producto)
    return <div className="error-message">Producto no encontrado</div>;

  const imagenPrincipal =
    producto.imagenes?.find((img) => img.es_principal == 1) ||
    producto.imagenes?.[0];

  return (
    <div className="producto-detalle">
      <div className="page-header">
        <Link to="/productos" className="detalle-volver">
          &larr; Volver a Productos
        </Link>
        <h1>{producto.nombre}</h1>
        <p>{producto.categoria}</p>
      </div>

      <div className="page-content">
        <div className="detalle-layout">
          <div className="detalle-imagen">
            {imagenPrincipal ? (
              <img
                src={resolveImageUrl(imagenPrincipal.url_imagen)}
                alt={imagenPrincipal.texto_alt || producto.nombre}
              />
            ) : (
              <div className="detalle-imagen-placeholder"></div>
            )}
          </div>

          <div className="detalle-info">
            <div className="detalle-precio">
              {formatoMoneda(producto.precio_base)}
            </div>

            <CuponBanner cupon={cupon} precioBase={producto.precio_base} />

            <BotonAgregarCarrito
              idProducto={producto.id_producto}
              nombre={producto.nombre}
              conCantidad
            />

            <div className="detalle-seccion">
              <h3>Descripción</h3>
              <p>{producto.descripcion}</p>
            </div>

            <div className="detalle-seccion">
              <h3>Categoría</h3>
              <span className="detalle-tag">{producto.categoria}</span>
            </div>

            {producto.ingredientes && producto.ingredientes.length > 0 && (
              <div className="detalle-seccion">
                <h3>Ingredientes</h3>
                <ul className="detalle-ingredientes">
                  {producto.ingredientes.map((ing) => (
                    <li key={ing.id_ingrediente} className="ingrediente-item">
                      <span className="ingrediente-nombre">
                        {ing.nombre}
                        {ing.es_ingrediente_principal == 1 && (
                          <span className="ingrediente-badge">Principal</span>
                        )}
                      </span>
                      {ing.es_alergeno == 1 && (
                        <span className="ingrediente-alergeno">Alérgeno</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {producto.tiempo_preparacion > 0 && (
              <div className="detalle-seccion">
                <h3>Tiempo de preparación</h3>
                <p>{producto.tiempo_preparacion} minutos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;