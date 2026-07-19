import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { comboService, resolveImageUrl } from '../services/api';
import { formatoMoneda } from '../utils/format';
import './ComboDetalle.css';

function ComboDetalle() {
  const { id } = useParams();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    comboService.getById(id)
      .then((res) => {
        setCombo(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el combo');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">Cargando combo...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!combo) return <div className="error-message">Combo no encontrado</div>;

  const imagenPrincipal = combo.imagenes?.find((img) => img.es_principal == 1) || combo.imagenes?.[0];

  return (
    <div className="combo-detalle">
      <div className="page-header">
        <Link to="/combos" className="detalle-volver">&larr; Volver a Combos</Link>
        <h1>{combo.nombre}</h1>
        <p>{combo.categoria}</p>
      </div>

      <div className="page-content">
        <div className="detalle-layout">
          <div className="detalle-imagen">
            {imagenPrincipal ? (
              <img
                src={resolveImageUrl(imagenPrincipal.url_imagen)}
                alt={imagenPrincipal.texto_alt || combo.nombre}
              />
            ) : (
              <div className="detalle-imagen-placeholder"></div>
            )}
          </div>

          <div className="detalle-info">
            <div className="detalle-precio">{formatoMoneda(combo.precio_combo)}</div>

            <div className="detalle-seccion">
              <h3>Descripción</h3>
              <p>{combo.descripcion}</p>
            </div>

            {combo.productos && combo.productos.length > 0 && (
              <div className="detalle-seccion">
                <h3>Productos incluidos</h3>
                <div className="combo-productos-lista">
                  {combo.productos.map((prod) => (
                    <div key={prod.id_producto} className="combo-producto-item">
                      <div className="combo-producto-img">
                        {prod.imagen ? (
                          <img src={resolveImageUrl(prod.imagen)} alt={prod.nombre} />
                        ) : (
                          <span></span>
                        )}
                      </div>
                      <div className="combo-producto-info">
                        <span className="combo-producto-nombre">{prod.nombre}</span>
                        <span className="combo-producto-cantidad">Cantidad: {prod.cantidad}</span>
                      </div>
                      <span className="combo-producto-precio">
                        {formatoMoneda(prod.precio_base)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComboDetalle;